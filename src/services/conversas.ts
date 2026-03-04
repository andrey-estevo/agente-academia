export async function listarConversas() {
  const response = await fetch(
    "https://noisygrasshopper-n8n.cloudfy.live/webhook/conversas"
  );

  if (!response.ok) {
    throw new Error("Erro ao buscar conversas");
  }

  return response.json();
}

export async function enviarMensagem(numero: string, mensagem: string) {
  const response = await fetch(
    "https://noisygrasshopper-n8n.cloudfy.live/webhook/responder",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        numero,
        mensagem,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Erro ao enviar mensagem");
  }

  return response.json();
}