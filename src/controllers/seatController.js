const Seat = require('../models/seatModel');

class SeatController {
    async getAllSeat(req, res) {
        try {
            const seats = await Seat.getAllSeat();
            res.status(200).json(seats);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }


    async getSeatsByTrip(req, res) {
        try {
            const { trip_id } = req.params;
            if (!trip_id) {
                return res.status(400).json({ message: "Thiếu trip_id" });
            }
    
            const seats = await Seat.searchSeats(trip_id);
            res.status(200).json(seats);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách ghế:", error);
            res.status(500).json({ message: "Lỗi server" });
        }
    }
    

    async getSeatById(req, res) {
        try {
            const { id } = req.params;
            const seat = await Seat.getSeatById(id);
            if (seat) {
                res.status(200).json(seat);
            } else {
                res.status(404).json({ message: 'Không tìm thấy ghế' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async addSeat(req, res) {
        try {
            const { trip_id, seat_number, status } = req.body;
            const newSeatId = await Seat.addSeat(trip_id, seat_number, status);
            res.status(201).json({ message: 'Thêm ghế thành công', id: newSeatId });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async updateSeat(req, res) {
        try {
            const { id } = req.params;
            const { trip_id, seat_number, status } = req.body;
            const affectedRows = await Seat.updateSeat(id, trip_id, seat_number, status);
            if (affectedRows > 0) {
                res.status(200).json({ message: 'Cập nhật ghế thành công' });
            } else {
                res.status(404).json({ message: 'Không tìm thấy ghế để cập nhật' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async deleteSeat(req, res) {
        try {
            const { id } = req.params;
            const affectedRows = await Seat.deleteSeat(id);
            if (affectedRows > 0) {
                res.status(200).json({ message: 'Xóa ghế thành công' });
            } else {
                res.status(404).json({ message: 'Không tìm thấy ghế để xóa' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async searchSeats(req, res) {
        try {
            const { trip_id, status } = req.query;
            
            if (!trip_id) {
                return res.status(400).json({ message: "Thiếu trip_id" });
            }
    
            const seats = await Seat.searchSeats(trip_id, status);
            
            if (seats.length > 0) {
                res.status(200).json(seats);
            } else {
                res.status(404).json({ message: "Không tìm thấy ghế cho trip_id này" });
            }
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Lỗi server" });
        }
    }
    
}

module.exports = new SeatController();
