import { Booking, Prisma } from "@prisma/client";
import prismaClient from "../prisma/client";

export async function createBooking(bookingInput: Prisma.BookingCreateInput) {
    const booking = await prismaClient.booking.create({
        data: bookingInput
    });
    return booking;
}


export async function createIdempotencyKey(key: string, bookingId: number) {
    const idempotencyKey = await prismaClient.idempotencyKey.create({
        data: {
            key,
            booking: {
                connect: {
                    id: bookingId
                }
            }
        }
    })
    return idempotencyKey;
}

export async function getIdempotencyKey(key: string) {
    const idempotencyKey = await prismaClient.idempotencyKey.findUnique({
        where: {
            key
        }
    })
    return idempotencyKey;
}

export async function getBookingById(bookingId: number) {
    const booking = await prismaClient.booking.findUnique({
        where: {
            id: bookingId
        }
    })
    return booking;
}






// tickect -> pending -> confirmed
//  or                -> cancelled
// or       -> pending -> confirmed -> cancelled

//  confirmBooking and cancelBooking function should we call wisely and service layer is responsible for it
export async function confirmBooking(bookingId: number) {
    const booking = await prismaClient.booking.update({
        where: {
            id: bookingId
        },
        data: {
            status: "CONFIRMED"
        }
    })
}

export async function cancelBooking(bookingId:number){
    const booking = await prismaClient.booking.update({
        where:{
            id:bookingId
        },
        data:{
            status:"CANCELLED"
        }
    })
}



export async function finalzeIdempotencyKey(key:string){
    const idempotencyKey = await prismaClient.idempotencyKey.update({
        where:{
            key
        },
        data:{
            finalized:true 
        }
    });
    return idempotencyKey;
}