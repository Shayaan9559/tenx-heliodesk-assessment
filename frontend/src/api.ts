export const statuses = ['open','in_progress','waiting_on_customer','resolved'] as const;
export const priorities = ['low','medium','high','urgent'] as const;
export type Status = typeof statuses[number];
export type Priority = typeof priorities[number];
export type Note = {id:number;ticket_id:string;body:string;author:string;created_at:string};
export type Summary = {id:string;title:string;requester_name:string;requester_email:string;status:Status;priority:Priority;assignee:string|null;created_at:string;updated_at:string};
export type Ticket = Summary & {description:string;notes:Note[]};
export type Query = {q:string;status:string;priority:string;sort:string;order:string;page:number};
export type ListResult = {data:Summary[];pagination:{page:number;pageSize:number;totalItems:number;totalPages:number}};
export const initialQuery:Query = {q:'',status:'',priority:'',sort:'updated_at',order:'desc',page:1};
export const label = (value:string) => value.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
export const date = (value:string) => new Intl.DateTimeFormat(undefined,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(value));
export class ApiError extends Error {
  constructor(public status:number, message:string, public fields:Record<string,string>={}) {super(message);}
}
const base = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/,'');
async function request<T>(path:string, options:RequestInit={}):Promise<T> {
  let response:Response;
  try {response = await fetch(`${base}/api${path}`, options);}
  catch(error) {if(error instanceof Error && error.name==='AbortError') throw error; throw new ApiError(0,'Could not connect. Check your connection and try again.');}
  const body = await response.json().catch(()=>null);
  if(!response.ok) throw new ApiError(response.status,body?.error?.message || 'The request could not be completed. Please try again.',body?.error?.fields || {});
  return body as T;
}
export const api = {
  list(query:Query,signal?:AbortSignal):Promise<ListResult> {
    const params = new URLSearchParams({sort:query.sort,order:query.order,page:String(query.page),page_size:'5'});
    if(query.q.trim()) params.set('q',query.q.trim());
    if(query.status) params.set('status',query.status);
    if(query.priority) params.set('priority',query.priority);
    return request(`/tickets?${params}`,{signal});
  },
  detail(id:string,signal?:AbortSignal):Promise<Ticket> {return request(`/tickets/${encodeURIComponent(id)}`,{signal});},
  update(id:string,values:{status:Status;priority:Priority}):Promise<Ticket> {return request(`/tickets/${encodeURIComponent(id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});},
  note(id:string,values:{body:string;author:string}):Promise<Ticket> {return request(`/tickets/${encodeURIComponent(id)}/notes`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(values)});}
};
