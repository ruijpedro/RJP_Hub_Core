export function localAssistant(question, context={}){
  const q = String(question || '').toLowerCase();
  const events = context.events || [];
  if(q.includes('exame') || q.includes('study')) return events.filter(e => String(e.origem).includes('Study'));
  if(q.includes('treino') || q.includes('swim')) return events.filter(e => String(e.origem).includes('Swim'));
  return events.slice(0, 10);
}
