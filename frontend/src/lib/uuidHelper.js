import { v5 as uuidv5 } from 'uuid';

// Random namespace for our app
const APP_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

/**
 * Converts a numeric ID (or any string) into a deterministic UUID.
 * This allows us to map the Long ID from UserService to the UUID required by TicketService.
 */
export const getStableUuid = (id) => {
    if (!id) return null;
    const idString = String(id);
    return uuidv5(idString, APP_NAMESPACE);
};