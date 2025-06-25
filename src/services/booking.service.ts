import { confirmBooking, createBooking, createIdempotencyKey, finalzeIdempotencyKey, getIdempotencyKey } from "../repositories/booking.repository"
import { BadRequestError, NotFoundError } from "../utils/errors/app.error";
import { generateIdempotencykey } from "../utils/generateIdempotencykey";
import { CreateBookingDTO } from "../dto/booking.dto";

export async function createBookingService(createBookingDTO:CreateBookingDTO) {
    
    const booking = await createBooking({
        userId: createBookingDTO.userId,
        hotelId: createBookingDTO.hotelId,
        totalGuests: createBookingDTO.totalGuests,
        bookingAmount: createBookingDTO.bookingAmount
    });

    const idempotencyKey = generateIdempotencykey();

    await createIdempotencyKey(idempotencyKey,booking.id);
    
    return {
        bookingId:booking.id,
        idempotencyKey:idempotencyKey
    }
}

export async function confrimBookingService(idempotencyKey:string) {
    const idempotencyKeyData = await getIdempotencyKey(idempotencyKey);
    if(!idempotencyKeyData){
        throw new NotFoundError('Idempotency key not found');
    }
    if(idempotencyKeyData.finalized){
        throw new BadRequestError('Idempotency key is already finalised');
    }

    if (idempotencyKeyData.bookingId === null) {
        throw new NotFoundError('Booking ID not found for the given idempotency key');
    }

    const booking = await confirmBooking(idempotencyKeyData.bookingId);

    await finalzeIdempotencyKey(idempotencyKey);

    return booking;
}