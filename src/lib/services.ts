import { db, storage } from "./firebase";
import { doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs, query, orderBy, deleteDoc, where } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
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

export interface MaintenanceRecord {
  id?: string;
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

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

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

import { onSnapshot } from "firebase/firestore";

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
