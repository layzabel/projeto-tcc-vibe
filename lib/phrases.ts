export const MASCOT_NAME = "Lumi";

export const AFFECTION = [
  "Eu gosto muito de você!",
  "Você é muito especial!",
  "Que alegria brincar com você!",
  "Você ilumina o meu dia!",
  "Um abraço bem quentinho!",
  "Você é meu melhor amigo!",
  "Que sorriso bonito!",
  "Você é muito carinhoso!",
];

export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function greeting(name: string): string {
  return name ? `Oi, ${name}! Que bom te ver!` : "Oi! Que bom te ver!";
}

export const INVITE = "Chame um adulto para brincar junto com você!";
export const WARNING = "Falta pouquinho para a tela descansar.";
export const TRY_AGAIN = ["Quase! Vamos tentar de novo?", "Essa caixa não. Tenta a outra!", "Você consegue! Tenta de novo!"];
export const GAME_INTRO = "Vamos guardar os brinquedos? Toque num brinquedo e depois na caixa da mesma cor.";
export const GAME_DONE = "Parabéns! Você guardou todos os brinquedos!";
export const CHOSEN = "Que ideia boa!";

export function timeUp(name: string): string {
  return name ? `${name}, chegou a hora de guardar a tela.` : "Chegou a hora de guardar a tela.";
}

export function praise(name: string): string {
  return name ? `${name}, você brincou muito bem hoje! Agora eu vou descansar.` : "Você brincou muito bem hoje! Agora eu vou descansar.";
}

export const CHOOSE = "O que vamos fazer agora? Escolha um!";
export const BYE = "Até amanhã! Tchau, tchau!";
