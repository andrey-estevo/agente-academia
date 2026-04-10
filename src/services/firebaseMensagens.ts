import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function ouvirMensagens(
  conversaId: string,
  callback: (data: any[]) => void,
  unidadeId?: string
) {

  const ref = unidadeId
    ? collection(db, "unidades", unidadeId, "mensagens")
    : collection(db, "mensagens");

  const q = query(
    ref,
    orderBy("horario", "asc")
  );

  return onSnapshot(q, (snapshot) => {

    const mensagens = snapshot.docs
      .map(doc => doc.data())
      .filter((m: any) => m.conversa_id === conversaId);

    callback(mensagens);

  });

}