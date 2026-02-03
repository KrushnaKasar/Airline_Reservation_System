package com.airlinereservation.resource;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.util.CollectionUtils;

import com.airlinereservation.dto.CommonApiResponse;
import com.airlinereservation.dto.FlightBookingRequestDto;
import com.airlinereservation.dto.FlightBookingResponseDto;
import com.airlinereservation.dto.FlightSeatDetailsResponse;
import com.airlinereservation.entity.Flight;
import com.airlinereservation.entity.FlightBooking;
import com.airlinereservation.entity.User;
import com.airlinereservation.service.FlightBookingService;
import com.airlinereservation.service.FlightService;
import com.airlinereservation.service.UserService;
import com.airlinereservation.utility.Constants.FlightBookingStatus;
import com.airlinereservation.utility.Constants.FlightClassType;
import com.airlinereservation.utility.IdGenerator;
import com.airlinereservation.utility.TicketDownloader;
import com.lowagie.text.DocumentException;

import jakarta.servlet.http.HttpServletResponse;

@Component
public class FlightBookingResource {

    @Autowired
    private FlightBookingService bookingService;

    @Autowired
    private FlightService flightService;

    @Autowired
    private UserService userService;

    public ResponseEntity<CommonApiResponse> addFlightBooking(FlightBookingRequestDto request) {

        CommonApiResponse response = new CommonApiResponse();

        if (request.getFlightId() == 0 || request.getPassengerId() == 0
                || request.getTotalPassengers() == 0 || request.getFlightClassType() == null) {
            response.setResponseMessage("Missing booking details");
            response.setSuccess(false);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        Flight flight = flightService.getById(request.getFlightId());
        User passenger = userService.getUserById(request.getPassengerId());

        BigDecimal seatFare = getFare(flight, request.getFlightClassType());

        if (seatFare == null) {
            response.setResponseMessage("Invalid flight class");
            response.setSuccess(false);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        BigDecimal totalFare = seatFare.multiply(BigDecimal.valueOf(request.getTotalPassengers()));

        if (passenger.getWalletAmount().compareTo(totalFare) < 0) {
            response.setResponseMessage("Insufficient wallet balance");
            response.setSuccess(false);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        String bookingId = IdGenerator.generateBookingId();
        String bookingTime = String.valueOf(
                LocalDateTime.now().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli()
        );

        List<FlightBooking> availableSeats =
                bookingService.getByFlightAndStatusAndFlightClass(
                        flight,
                        FlightBookingStatus.AVAILABLE.value(),
                        request.getFlightClassType()
                );

        int confirmCount = Math.min(request.getTotalPassengers(), availableSeats.size());

        for (int i = 0; i < confirmCount; i++) {
            FlightBooking seat = availableSeats.get(i);
            seat.setBookingId(bookingId);
            seat.setBookingTime(bookingTime);
            seat.setPassenger(passenger);
            seat.setStatus(FlightBookingStatus.CONFIRMED.value());
            bookingService.add(seat);

            passenger.setWalletAmount(passenger.getWalletAmount().subtract(seatFare));
        }

        userService.updateUser(passenger);

        if (request.getTotalPassengers() > confirmCount) {
            int waitingCount = request.getTotalPassengers() - confirmCount;

            for (int i = 0; i < waitingCount; i++) {
                FlightBooking waiting = FlightBooking.builder()
                        .flight(flight)
                        .flightClass(request.getFlightClassType())
                        .passenger(passenger)
                        .bookingId(bookingId)
                        .bookingTime(bookingTime)
                        .status(FlightBookingStatus.WAITING.value())
                        .build();

                bookingService.add(waiting);
            }
        }

        response.setResponseMessage("Booking successful. Booking ID: " + bookingId);
        response.setSuccess(true);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    private BigDecimal getFare(Flight flight, String type) {
        if (type.equals(FlightClassType.ECONOMY.value())) return flight.getEconomySeatFare();
        if (type.equals(FlightClassType.BUSINESS.value())) return flight.getBusinessSeatFare();
        if (type.equals(FlightClassType.FIRST_CLASS.value())) return flight.getFirstClassSeatFare();
        return null;
    }

    public ResponseEntity<FlightBookingResponseDto> fetchAllFlightBookings() {

        FlightBookingResponseDto response = new FlightBookingResponseDto();

        List<FlightBooking> bookings =
                bookingService.getByStatusIn(Arrays.asList(
                        FlightBookingStatus.CONFIRMED.value(),
                        FlightBookingStatus.CANCELLED.value(),
                        FlightBookingStatus.WAITING.value()
                ));

        response.setBookings(bookings);
        response.setSuccess(true);
        response.setResponseMessage("Bookings fetched");

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    public ResponseEntity<FlightBookingResponseDto> fetchUserBookings(int userId) {

        FlightBookingResponseDto response = new FlightBookingResponseDto();

        User user = userService.getUserById(userId);

        List<FlightBooking> bookings = bookingService.getByPassenger(user);

        response.setBookings(bookings);
        response.setSuccess(true);
        response.setResponseMessage("User bookings fetched");

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    public ResponseEntity<FlightBookingResponseDto> fetchBookingsByFlight(int flightId) {

        FlightBookingResponseDto response = new FlightBookingResponseDto();

        if (flightId == 0) {
            response.setResponseMessage("Missing flight id");
            response.setSuccess(false);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        Flight flight = flightService.getById(flightId);

        List<FlightBooking> bookings =
                bookingService.getByFlightAndStatusNotIn(
                        flight,
                        Arrays.asList(
                                FlightBookingStatus.CANCELLED.value(),
                                FlightBookingStatus.WAITING.value(),
                                FlightBookingStatus.PENDING.value()
                        )
                );

        response.setBookings(bookings);
        response.setSuccess(true);
        response.setResponseMessage("Flight bookings fetched");

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    public ResponseEntity<CommonApiResponse> cancelFlightBooking(int bookingId) {

        CommonApiResponse response = new CommonApiResponse();

        FlightBooking booking = bookingService.getById(bookingId);

        if (booking == null) {
            response.setResponseMessage("Booking not found");
            response.setSuccess(false);
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
        }

        booking.setStatus(FlightBookingStatus.CANCELLED.value());
        bookingService.add(booking);

        response.setResponseMessage("Ticket cancelled successfully");
        response.setSuccess(true);

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    public void downloadBookingTicket(String bookingId, HttpServletResponse response)
            throws DocumentException, IOException {

        List<FlightBooking> bookings = bookingService.getByBookingId(bookingId);

        if (CollectionUtils.isEmpty(bookings)) return;

        response.setContentType("application/pdf");
        response.setHeader("Content-Disposition",
                "attachment; filename=" + bookingId + "_ticket.pdf");

        new TicketDownloader(bookings).export(response);
    }

    public ResponseEntity<FlightSeatDetailsResponse> fetchFlightSeatDetails(int flightId) {

        FlightSeatDetailsResponse res = new FlightSeatDetailsResponse();

        Flight flight = flightService.getById(flightId);
        List<FlightBooking> bookings = bookingService.getByFlight(flight);

        if (CollectionUtils.isEmpty(bookings)) {
            res.setResponseMessage("No seat details found");
            res.setSuccess(false);
            return new ResponseEntity<>(res, HttpStatus.BAD_REQUEST);
        }

        long ecoAvail = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.ECONOMY.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.AVAILABLE.value()))
                .count();

        long ecoWait = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.ECONOMY.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.WAITING.value()))
                .count();

        long busAvail = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.BUSINESS.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.AVAILABLE.value()))
                .count();

        long busWait = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.BUSINESS.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.WAITING.value()))
                .count();

        long firstAvail = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.FIRST_CLASS.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.AVAILABLE.value()))
                .count();

        long firstWait = bookings.stream()
                .filter(b -> b.getFlightClass().equals(FlightClassType.FIRST_CLASS.value()))
                .filter(b -> b.getStatus().equals(FlightBookingStatus.WAITING.value()))
                .count();

        res.setEconomySeatsAvailable((int) ecoAvail);
        res.setEconomySeatsWaiting((int) ecoWait);

        res.setBusinessSeatsAvailable((int) busAvail);
        res.setBusinessSeatsWaiting((int) busWait);

        res.setFirstClassSeatsAvailable((int) firstAvail);
        res.setFirstClassSeatsWaiting((int) firstWait);

        res.setEconomySeats(flight.getAirplane().getEconomySeats());
        res.setBusinessSeats(flight.getAirplane().getBusinessSeats());
        res.setFirstClassSeats(flight.getAirplane().getFirstClassSeats());

        res.setTotalSeat(flight.getAirplane().getTotalSeat());

        res.setSuccess(true);
        res.setResponseMessage("Seat details fetched");

        return new ResponseEntity<>(res, HttpStatus.OK);
    }
}
