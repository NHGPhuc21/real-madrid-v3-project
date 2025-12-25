import api from "@/services/api";

/* Admin */
export function getGreetings(eventKey) {
  return api.get(`/events/${eventKey}/greetings`);
}

export function addGreeting(eventKey, data) {
  return api.post(`/events/${eventKey}/greetings`, data);
}

export function updateGreeting(id, data) {
  return api.put(`/greetings/${id}`, data);
}

export function deleteGreeting(id) {
  return api.delete(`/greetings/${id}`);
}

/* User / Admin */
export function getRandomGreeting(eventKey) {
  return api.get(`/events/${eventKey}/random-greeting`);
}
