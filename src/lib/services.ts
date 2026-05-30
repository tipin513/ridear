import { db, storage } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, where, writeBatch, onSnapshot, deleteField } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  currentBikeId?: string; // Phase 7: Reference to the currently active bike
  hasMigratedToMultiBike?: boolean; // Phase 8: Flag to prevent migration loops
  
  // Legacy fields (kept for migration purposes, will be deleted after migration)
  bannerURL?: string;
  bikeInfo?: {
    brand: string;
    model: string;
    year: string;
    mileage: number;
  };
  serviceIntervals?: {
    oil: number; // km interval for oil change
  };
}

export interface Bike {
  id: string;
  brand: string;
  model: string;
  year: string;
  mileage: number;
  bannerURL?: string;
  serviceIntervals: {
    oil: number;
  };
}

export interface MaintenanceRecord {
  id?: string;
  bikeId?: string; // Reference to the bike this record belongs to
  date: string;
  mileage: number;
  cost: number;
  notes: string;
  category: "Fluidos" | "Desgaste" | "General";
  type: string; // Ej: "Aceite", "Frenos"
}

export interface Workshop {
  id?: string;
  name: string;
  phone: string;
  address: string;
  specialty: string;
  notes?: string;
  isPublic: boolean;
  ownerUid: string;
}

export interface DigitalDocument {
  id: string;
  bikeId?: string; // Reference to the bike, or undefined/"global" for user-level docs like license
  type: 'licencia' | 'cedula' | 'seguro' | 'vtv' | 'otro';
  customTypeName?: string;
  imageUrl: string;
  storagePath: string;
  expiryDate?: string;
  createdAt: any;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

// --- MIGRATION LOGIC (Fase 7) ---

export const migrateUserToMultiBike = async (uid: string) => {
  const profile = await getUserProfile(uid);
  // Si ya tiene el flag de migración, no hacer nada.
  if (!profile || profile.hasMigratedToMultiBike) return;

  // Verificamos si tiene datos viejos que migrar
  if (profile.bikeInfo && Object.keys(profile.bikeInfo).length > 0) {
    const batch = writeBatch(db);
    
    // 1. Create the default bike
    const newBikeRef = doc(collection(db, "users", uid, "bikes"));
    const defaultBike: Omit<Bike, 'id'> = {
      brand: profile.bikeInfo.brand,
      model: profile.bikeInfo.model,
      year: profile.bikeInfo.year,
      mileage: profile.bikeInfo.mileage,
      serviceIntervals: profile.serviceIntervals || { oil: 5000 },
      bannerURL: profile.bannerURL
    };
    batch.set(newBikeRef, defaultBike);

    // 2. Update the user profile
    const profileRef = doc(db, "users", uid);
    batch.update(profileRef, {
      currentBikeId: newBikeRef.id,
      hasMigratedToMultiBike: true,
      bikeInfo: deleteField(),
      serviceIntervals: deleteField(),
      bannerURL: deleteField()
    });

    // 3. Migrate all maintenance records to this bike
    const recordsRef = collection(db, "users", uid, "maintenances");
    const recordsSnap = await getDocs(recordsRef);
    recordsSnap.docs.forEach(docSnap => {
      batch.update(docSnap.ref, { bikeId: newBikeRef.id });
    });

    // 4. Migrate documents
    const docsRef = collection(db, "users", uid, "documents");
    const docsSnap = await getDocs(docsRef);
    docsSnap.docs.forEach(docSnap => {
      const docData = docSnap.data() as DigitalDocument;
      // "licencia" is user-global, everything else belongs to the default bike
      if (docData.type !== "licencia") {
        batch.update(docSnap.ref, { bikeId: newBikeRef.id });
      }
    });

    await batch.commit();
    console.log("Migración a Multi-Moto completada con éxito para el usuario:", uid);
  } else {
    // Si no tiene moto para migrar, simplemente marcamos como migrado
    const profileRef = doc(db, "users", uid);
    await updateDoc(profileRef, {
      hasMigratedToMultiBike: true
    });
  }
};
// --------------------------------


export const initializeUserProfile = async (user: any): Promise<UserProfile> => {
  const docRef = doc(db, "users", user.uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      bikeInfo: {
        brand: "Sin especificar",
        model: "Sin especificar",
        year: "----",
        mileage: 0,
      },
      serviceIntervals: {
        oil: 5000 // default
      }
    };
    await setDoc(docRef, newProfile);
    return newProfile;
  }
  return docSnap.data() as UserProfile;
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, data);
};

export const uploadUserImage = async (uid: string, file: File, type: 'avatar' | 'banner'): Promise<string> => {
  const fileExtension = file.name.split('.').pop();
  const storageRef = ref(storage, `users/${uid}/${type}_${Date.now()}.${fileExtension}`);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

// --- BIKES CRUD ---
export const addBike = async (uid: string, bike: Omit<Bike, 'id'>) => {
  const bikesRef = collection(db, "users", uid, "bikes");
  const docRef = await addDoc(bikesRef, bike);
  return docRef.id;
};

export const updateBike = async (uid: string, bikeId: string, data: Partial<Bike>) => {
  const bikeRef = doc(db, "users", uid, "bikes", bikeId);
  await updateDoc(bikeRef, data);
};

export const deleteBike = async (uid: string, bikeId: string) => {
  console.log(`[deleteBike] Empezando proceso para uid=${uid}, bikeId=${bikeId}`);
  const batch = writeBatch(db);
  
  // 1. Marcar la moto para borrar
  const bikeRef = doc(db, "users", uid, "bikes", bikeId);
  batch.delete(bikeRef);
  console.log(`[deleteBike] Añadido delete de moto a la tanda`);

  // 2. Borrar mantenimientos asociados
  const maintRef = collection(db, "users", uid, "maintenances");
  const maintQuery = query(maintRef, where("bikeId", "==", bikeId));
  const maintSnap = await getDocs(maintQuery);
  console.log(`[deleteBike] Encontrados ${maintSnap.size} mantenimientos para eliminar`);
  maintSnap.forEach(docSnap => {
    console.log(`[deleteBike] Marcando mantenimiento ${docSnap.id} para borrar`);
    batch.delete(docSnap.ref);
  });

  // 3. Borrar documentos asociados (y sus archivos en Storage)
  const docsRef = collection(db, "users", uid, "documents");
  const docsQuery = query(docsRef, where("bikeId", "==", bikeId));
  const docsSnap = await getDocs(docsQuery);
  console.log(`[deleteBike] Encontrados ${docsSnap.size} documentos para procesar`);
  
  const storageDeletePromises: Promise<void>[] = [];
  
  docsSnap.forEach(docSnap => {
    const data = docSnap.data() as DigitalDocument;
    if (data.type !== 'licencia') {
      console.log(`[deleteBike] Marcando documento ${docSnap.id} para borrar`);
      batch.delete(docSnap.ref);
      if (data.storagePath) {
        console.log(`[deleteBike] Borrando archivo de Storage: ${data.storagePath}`);
        const fileRef = ref(storage, data.storagePath);
        storageDeletePromises.push(deleteObject(fileRef).catch(e => console.error("Error borrar foto:", e)));
      }
    } else {
      console.log(`[deleteBike] Omitiendo documento 'licencia' (${docSnap.id}) ya que es global.`);
    }
  });

  console.log(`[deleteBike] Borrando archivos de Storage...`);
  await Promise.all(storageDeletePromises);
  console.log(`[deleteBike] Commit al lote de Firestore...`);
  await batch.commit();
  console.log(`[deleteBike] Proceso completado exitosamente`);
};


export const getBikes = async (uid: string): Promise<Bike[]> => {
  const bikesRef = collection(db, "users", uid, "bikes");
  const snap = await getDocs(bikesRef);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Bike[];
};

export const getBike = async (uid: string, bikeId: string): Promise<Bike | null> => {
  const bikeRef = doc(db, "users", uid, "bikes", bikeId);
  const docSnap = await getDoc(bikeRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Bike;
  }
  return null;
};

export const subscribeToBikes = (uid: string, callback: (bikes: Bike[]) => void) => {
  const bikesRef = collection(db, "users", uid, "bikes");
  return onSnapshot(bikesRef, (querySnapshot) => {
    const bikes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Bike[];
    callback(bikes);
  });
};

export const subscribeToBike = (uid: string, bikeId: string, callback: (bike: Bike | null) => void) => {
  const bikeRef = doc(db, "users", uid, "bikes", bikeId);
  return onSnapshot(bikeRef, (docSnap) => {
    if (docSnap.exists()) {
      callback({ id: docSnap.id, ...docSnap.data() } as Bike);
    } else {
      callback(null);
    }
  });
};
// ------------------

export const addMaintenanceRecord = async (uid: string, record: Omit<MaintenanceRecord, 'id'>) => {
  const recordsRef = collection(db, "users", uid, "maintenances");
  await addDoc(recordsRef, record);
};

export const deleteMaintenanceRecord = async (uid: string, recordId: string) => {
  const recordDocRef = doc(db, "users", uid, "maintenances", recordId);
  await deleteDoc(recordDocRef);
};

export const getMaintenanceRecords = async (uid: string): Promise<MaintenanceRecord[]> => {
  const recordsRef = collection(db, "users", uid, "maintenances");
  const q = query(recordsRef, orderBy("mileage", "desc"));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MaintenanceRecord[];
};

// Digital Documents (Guantera Digital)
export const uploadDigitalDocument = async (uid: string, docType: string, file: File, expiryDate?: string, customTypeName?: string, bikeId?: string) => {
  const fileExtension = file.name.split('.').pop();
  const timestamp = Date.now();
  const storagePath = `users/${uid}/documents/${docType}_${timestamp}.${fileExtension}`;
  const storageRef = ref(storage, storagePath);
  
  await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(storageRef);

  const newDoc: Omit<DigitalDocument, 'id'> = {
    type: docType as DigitalDocument['type'],
    imageUrl,
    storagePath,
    createdAt: timestamp,
  };
  
  if (bikeId && docType !== 'licencia') newDoc.bikeId = bikeId;
  if (expiryDate) newDoc.expiryDate = expiryDate;
  if (customTypeName && docType === 'otro') newDoc.customTypeName = customTypeName;

  const docsRef = collection(db, "users", uid, "documents");
  await addDoc(docsRef, newDoc);
};

export const subscribeToDigitalDocuments = (uid: string, callback: (docs: DigitalDocument[]) => void) => {
  const docsRef = collection(db, "users", uid, "documents");
  const q = query(docsRef, orderBy("createdAt", "desc"));
  return onSnapshot(q, (querySnapshot) => {
    const docs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as DigitalDocument[];
    callback(docs);
  });
};

export const deleteDigitalDocument = async (uid: string, documentId: string, storagePath: string) => {
  // Delete from Firestore
  const docRef = doc(db, "users", uid, "documents", documentId);
  await deleteDoc(docRef);

  // Delete from Storage
  const storageRef = ref(storage, storagePath);
  try {
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error al borrar el archivo del storage:", error);
  }
};


export const subscribeToUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const docRef = doc(db, "users", uid);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as UserProfile);
    } else {
      callback(null);
    }
  });
};

export const subscribeToMaintenanceRecords = (uid: string, callback: (records: MaintenanceRecord[]) => void) => {
  const recordsRef = collection(db, "users", uid, "maintenances");
  const q = query(recordsRef, orderBy("mileage", "desc"));
  return onSnapshot(q, (querySnapshot) => {
    const records = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MaintenanceRecord[];
    callback(records);
  });
};

// Workshops (Mis Mecánicos & Públicos)
export const addWorkshop = async (uid: string, workshop: Omit<Workshop, 'id'>) => {
  const workshopsRef = collection(db, "users", uid, "workshops");
  const docRef = await addDoc(workshopsRef, workshop);

  if (workshop.isPublic) {
    const publicRef = doc(db, "publicWorkshops", docRef.id);
    await setDoc(publicRef, { ...workshop, originalId: docRef.id, originalUid: uid });
  }
};

export const updateWorkshop = async (uid: string, workshopId: string, data: Partial<Workshop>) => {
  const workshopRef = doc(db, "users", uid, "workshops", workshopId);
  await updateDoc(workshopRef, data);

  const publicRef = doc(db, "publicWorkshops", workshopId);
  const docSnap = await getDoc(workshopRef);
  if (docSnap.exists()) {
    const currentData = docSnap.data() as Workshop;
    if (currentData.isPublic) {
      await setDoc(publicRef, { ...currentData, originalId: workshopId, originalUid: uid });
    } else {
      try { await deleteDoc(publicRef); } catch(e) {}
    }
  }
};

export const deleteWorkshop = async (uid: string, workshopId: string) => {
  const workshopRef = doc(db, "users", uid, "workshops", workshopId);
  await deleteDoc(workshopRef);

  const publicRef = doc(db, "publicWorkshops", workshopId);
  try {
    await deleteDoc(publicRef);
  } catch(e) {}
};

export const subscribeToWorkshops = (uid: string, callback: (workshops: Workshop[]) => void) => {
  const workshopsRef = collection(db, "users", uid, "workshops");
  const q = query(workshopsRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const workshops = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Workshop[];
    callback(workshops);
  });
};

export const subscribeToPublicWorkshops = (callback: (workshops: Workshop[]) => void) => {
  const publicWorkshopsRef = collection(db, "publicWorkshops");
  const q = query(publicWorkshopsRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const workshops = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Workshop[];
    callback(workshops);
  });
};

// --- Towing (Grúas y Asistencias) ---
export interface Towing {
  id?: string;
  name: string;
  phone: string;
  area: string;
  notes?: string;
  isPublic: boolean;
  ownerUid: string;
}

export const addTowing = async (uid: string, towing: Omit<Towing, 'id'>) => {
  const towingRef = collection(db, "users", uid, "towing");
  const docRef = await addDoc(towingRef, towing);

  if (towing.isPublic) {
    const publicRef = doc(db, "publicTowing", docRef.id);
    await setDoc(publicRef, { ...towing, originalId: docRef.id, originalUid: uid });
  }
};

export const updateTowing = async (uid: string, towingId: string, data: Partial<Towing>) => {
  const towingRef = doc(db, "users", uid, "towing", towingId);
  await updateDoc(towingRef, data);

  const publicRef = doc(db, "publicTowing", towingId);
  const docSnap = await getDoc(towingRef);
  if (docSnap.exists()) {
    const currentData = docSnap.data() as Towing;
    if (currentData.isPublic) {
      await setDoc(publicRef, { ...currentData, originalId: towingId, originalUid: uid });
    } else {
      try { await deleteDoc(publicRef); } catch(e) {}
    }
  }
};

export const deleteTowing = async (uid: string, towingId: string) => {
  const towingRef = doc(db, "users", uid, "towing", towingId);
  await deleteDoc(towingRef);

  const publicRef = doc(db, "publicTowing", towingId);
  try {
    await deleteDoc(publicRef);
  } catch(e) {}
};

export const subscribeToTowing = (uid: string, callback: (towing: Towing[]) => void) => {
  const towingRef = collection(db, "users", uid, "towing");
  const q = query(towingRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const towings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Towing[];
    callback(towings);
  });
};

export const subscribeToPublicTowing = (callback: (towings: Towing[]) => void) => {
  const publicTowingRef = collection(db, "publicTowing");
  const q = query(publicTowingRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const towings = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Towing[];
    callback(towings);
  });
};

// --- Stores (Tiendas de Repuestos) ---
export interface Store {
  id?: string;
  name: string;
  phone: string;
  address: string;
  categories: string[];
  brands: string[];
  notes?: string;
  isPublic: boolean;
  ownerUid: string;
}

export const addStore = async (uid: string, store: Omit<Store, 'id'>) => {
  const storesRef = collection(db, "users", uid, "stores");
  const docRef = await addDoc(storesRef, store);

  if (store.isPublic) {
    const publicRef = doc(db, "publicStores", docRef.id);
    await setDoc(publicRef, { ...store, originalId: docRef.id, originalUid: uid });
  }
};

export const updateStore = async (uid: string, storeId: string, data: Partial<Store>) => {
  const storeRef = doc(db, "users", uid, "stores", storeId);
  await updateDoc(storeRef, data);

  const publicRef = doc(db, "publicStores", storeId);
  const docSnap = await getDoc(storeRef);
  if (docSnap.exists()) {
    const currentData = docSnap.data() as Store;
    if (currentData.isPublic) {
      await setDoc(publicRef, { ...currentData, originalId: storeId, originalUid: uid });
    } else {
      try { await deleteDoc(publicRef); } catch(e) {}
    }
  }
};

export const deleteStore = async (uid: string, storeId: string) => {
  const storeRef = doc(db, "users", uid, "stores", storeId);
  await deleteDoc(storeRef);

  const publicRef = doc(db, "publicStores", storeId);
  try {
    await deleteDoc(publicRef);
  } catch(e) {}
};

export const subscribeToStores = (uid: string, callback: (stores: Store[]) => void) => {
  const storesRef = collection(db, "users", uid, "stores");
  const q = query(storesRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const stores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Store[];
    callback(stores);
  });
};

export const subscribeToPublicStores = (callback: (stores: Store[]) => void) => {
  const publicStoresRef = collection(db, "publicStores");
  const q = query(publicStoresRef, orderBy("name", "asc"));
  return onSnapshot(q, (querySnapshot) => {
    const stores = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Store[];
    callback(stores);
  });
};
