import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getPlanos() {
  const snapshot = await getDocs(collection(db, "planos"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updatePlano(id: string, data: any) {
  const ref = doc(db, "planos", id);
  await updateDoc(ref, data);
}