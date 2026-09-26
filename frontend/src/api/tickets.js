import client from './client';

export const listTickets = (params = {}) =>
  client.get('/tickets/', { params }).then((res) => res.data);

export const getTicket = (id) => client.get(`/tickets/${id}/`).then((res) => res.data);

export const createTicket = (payload) => client.post('/tickets/', payload).then((res) => res.data);

export const updateTicket = (id, payload) => client.patch(`/tickets/${id}/`, payload).then((res) => res.data);

export const deleteTicket = (id) => client.delete(`/tickets/${id}/`);

export const getTicketStats = () => client.get('/tickets/stats/').then((res) => res.data);

export const listComments = (ticketId) =>
  client.get(`/tickets/${ticketId}/comments`).then((res) => res.data);

export const addComment = (ticketId, comment) =>
  client.post(`/tickets/${ticketId}/comments`, { comment }).then((res) => res.data);

export const listAgents = () => client.get('/users').then((res) => res.data);
