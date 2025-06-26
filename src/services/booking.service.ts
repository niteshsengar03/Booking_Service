import { confirmBooking, createBooking, createIdempotencyKey, finalzeIdempotencyKey, getIdempotencyKeyWithLock } from "../repositories/booking.repository"
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { generateIdempotencykey } from "../utils/generateIdempotencykey";
import { CreateBookingDTO } from "../dto/booking.dto";

import primsaClient from '../prisma/client';

export async function createBookingService(createBookingDTO: CreateBookingDTO) {

    const booking = await createBooking({
        userId: createBookingDTO.userId,
        hotelId: createBookingDTO.hotelId,
        totalGuests: createBookingDTO.totalGuests,
        bookingAmount: createBookingDTO.bookingAmount
    });

    const idempotencyKey = generateIdempotencykey();

    await createIdempotencyKey(idempotencyKey, booking.id);

    return {
        bookingId: booking.id,
        idempotencyKey: idempotencyKey
    }
}


// implementing transaction and pestimic lock on row when using getIdempotnecyKey
export async function confrimBookingService(idempotencyKey: string) {
    return primsaClient.$transaction(async (tx) => {
        const idempotencyKeyData = await getIdempotencyKeyWithLock(tx, idempotencyKey);
        // not found check is done in repositroy layer
        if (!idempotencyKeyData) {
            throw new NotFoundError('Idempotency key not found');
        }
        if (idempotencyKeyData.finalized) {
            throw new BadRequestError('Idempotency key is already finalised');
        }

        if (idempotencyKeyData.bookingId === null) {
            throw new NotFoundError('Booking ID not found for the given idempotency key');
        }

        const booking = await confirmBooking(tx, idempotencyKeyData.bookingId); 

        await finalzeIdempotencyKey(tx, idempotencyKey);

        return booking;
    })

}