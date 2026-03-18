import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getHorarios() {
  const snapshot = await getDocs(collection(db, "horarios"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}

export async function updateHorario(id: string, data: any) {
  const ref = doc(db, "horarios", id);
  await updateDoc(ref, data);
}