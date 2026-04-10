import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Conversation } from "@/types";

export function ouvirConversas(
  callback: (data: Conversation[]) => void,
  unidadeId?: string
) {

  // 🔥 DEFINE COLLECTION (MULTI OU ANTIGO)
  const ref = unidadeId
    ? collection(db, "unidades", unidadeId, "conversas")
    : collection(db, "conversas");

  const q = query(
    ref,
    orderBy("ultima_atualizacao", "desc")
  );

  return onSnapshot(q, (snapshot) => {

    const conversas: Conversation[] = snapshot.docs.map((doc) => {

      const d: any = doc.data();

      const numero = String(d.telefone || doc.id);

      const ultimaAtualizacao = d.ultima_atualizacao
        ? new Date(d.ultima_atualizacao.seconds * 1000).toISOString()
        : "";

      return {
        id: numero,
        numero: numero,
        conversa_id: numero,
        nome: d.nome || numero,
        ultima_mensagem: d.ultima_mensagem || "",
        ultima_atualizacao: ultimaAtualizacao,
        status: d.status || "bot",
        setor: d.setor || "geral",
        unidade_id: unidadeId || d.unidade_id || ""
      };

    });

    callback(conversas);

  });

}