const Ticket = require('../models/ticketModel');
const { maskPhone, maskEmail } = require('./successController');

class TicketController {
    async getAllTicket(req, res) {
        try {
            const tickets = await Ticket.getAllTicket();
            res.status(200).json(tickets);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async getTicketById(req, res) {
        try {
            const { id } = req.params;
            const ticket = await Ticket.getTicketById(id);
            if (ticket) {
                res.status(200).json(ticket);
            } else {
                res.status(404).json({ message: 'Không tìm thấy vé' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
    async getTicketsByUser(req, res) {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.redirect('/login');
        }
    
        const tickets = await Ticket.getTicketsByUserId(userId);
        res.render('thong-tin-tai-khoan/lich-su-mua-ve', {
          tickets
        });
      } catch (err) {
        console.error("❌ Lỗi lấy lịch sử vé:", err);
        res.status(500).send("Lỗi server");
      }
    }
    
    async addTicket(req, res) {
      try {
        const {
          trip_id,
          ticket_price,
          seat_ids,
          customer_name,
          customer_phone,
          customer_email,
          pickup_location,
          dropoff_location,
          total_price_ticket
        } = req.body;
  
        const user_id = req.user?.id || null;
  
        if (
          !trip_id || !ticket_price || !seat_ids || seat_ids.length === 0 ||
          !customer_name || !customer_phone || !customer_email
        ) {
          return res.status(400).json({ message: 'Thiếu thông tin đặt vé' });
        }
  
        const { ticket_id, ticket_code } = await Ticket.addTicket(
          trip_id,
          user_id,
          ticket_price,
          seat_ids,
          customer_name,
          customer_phone,
          customer_email,
          pickup_location,
          dropoff_location,
          total_price_ticket
        );
  
        res.status(201).json({
          message: 'Vé đã được giữ tạm thời!',
          ticket_id,
          ticket_code
        });
      } catch (err) {
        console.error('❌ Lỗi khi đặt vé:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
      }
    }
    
    

    // Xác nhận thanh toán

    
    async deleteExpiredTickets(req, res) {
        try {
            await Ticket.deleteExpiredTickets();
            res.status(200).json({ message: "Đã xóa vé hết hạn." });
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
   
    async updateTicket(req, res) {
        try {
          const { ticket_id } = req.params;
          const { customer_name, customer_phone, status, seat_numbers } = req.body;
      
          const ticket = await Ticket.getTicketById(ticket_id);
          if (!ticket) {
            return res.status(404).json({ message: "Không tìm thấy vé" });
          }
      
          const trip_id = ticket.trip_id;
      
          // 🔄 Chuyển seat_number (ví dụ B01, B02) thành seat_id
          const seat_ids = await Ticket.getSeatIdsBySeatNumbers(trip_id, seat_numbers);
      
          if (seat_ids.length !== seat_numbers.length) {
            return res.status(400).json({ message: "Một hoặc nhiều ghế không hợp lệ cho chuyến này" });
          }
      
          // Cập nhật ghế: ghế cũ về AVAILABLE, ghế mới BOOKED
          const oldSeatIds = await Ticket.getSeatIdsByTicketId(ticket_id);
          await Ticket.updateSeatStatus(oldSeatIds, 'AVAILABLE');
          await Ticket.updateSeatStatus(seat_ids, 'BOOKED');
      
          // Cập nhật bảng ticket_seats
          await Ticket.deleteSeatsOfTicket(ticket_id);
          await Ticket.insertSeatsForTicket(ticket_id, seat_ids);
      
          // Cập nhật thông tin khách và trạng thái vé
          await Ticket.updateTicketCustomerStatus(ticket_id, customer_name, customer_phone, status);
      
          res.status(200).json({ message: "Cập nhật vé thành công!" });
        } catch (error) {
          console.error("❌ Lỗi khi cập nhật vé:", error);
          res.status(500).json({ message: "Lỗi server", error: error.message });
        }
      }
      
      
      
      
    async getDetailedTickets(req, res) {
        try {
            const { trip_id, ticket_id } = req.query;
            const user_id = req.user ? req.user.id: null;
            let detailedTickets;
    
            if (trip_id && ticket_id) {
                detailedTickets = await Ticket.getDetailedTickets(trip_id, ticket_id);
            } else {
                return res.status(400).json({ message: "Thiếu trip_id hoặc ticket_id" });
            }
    
            if (detailedTickets.length === 0) {
                return res.status(404).json({ message: "Không tìm thấy thông tin vé" });
            }
    
            res.status(200).json(detailedTickets);
        } catch (error) {
            console.error("❌ Lỗi khi lấy thông tin chi tiết vé:", error);
            res.status(500).json({ message: 'Lỗi server' });
        }
    }
    async searchTicketByIdOrCode(req, res) {
        try {
            const { id, ticket_code } = req.query;
    
            if (!id && !ticket_code) {
                return res.status(400).json({ message: "Vui lòng cung cấp id hoặc ticket_code" });
            }
    
            const tickets = await Ticket.searchTicketByIdOrCode(id, ticket_code);
            
            if (tickets.length > 0) {
                res.status(200).json(tickets);
            } else {
                res.status(404).json({ message: "Không tìm thấy vé" });
            }
        } catch (error) {
            console.error("Lỗi tìm kiếm vé:", error);
            res.status(500).json({ message: "Lỗi server" });
        }
    }
    

    async deleteTicket(req, res) {
        try {
            const { id } = req.params;
            const affectedRows = await Ticket.deleteTicket(id);
            if (affectedRows > 0) {
                res.status(200).json({ message: 'Xóa vé thành công' });
            } else {
                res.status(404).json({ message: 'Không tìm thấy vé để xóa' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Lỗi server' });
        }
    }

    async renderAdminTickets(req, res) {
        try {
            const tickets = await Ticket.getAllTicketsWithTripName();
            res.render('admin/tickets/tickets', {
                title: "Quản lý Vé đặt",
                tickets: tickets || []
            });
        } catch (error) {
            console.log(error);
            res.status(500).send("Lỗi khi tải danh sách vé đặt");
        }
    }
    
    async renderUpdateTicket(req, res) {
        try {
          const { ticket_id } = req.params;
          const ticket = await Ticket.getTicketById(ticket_id);
          if (!ticket) return res.status(404).send("Không tìm thấy vé.");
      
          // Lấy tất cả ghế của chuyến đi
          const seats = await Ticket.getSeatsByTripId(ticket.trip_id);
      
          // Lấy danh sách seat_id đã đặt của vé hiện tại
          const selectedSeatIds = await Ticket.getSeatIdsByTicketId(ticket_id);
          ticket.seat_ids = selectedSeatIds.map(s => s.seat_id);
      
          // Lấy seat_number (ví dụ: A01, A02)
          const seatNumbers = await Ticket.getSeatNumbersByTicketId(ticket_id);
          ticket.seat_numbers = seatNumbers;
      
          // Số lượng ghế cần giữ nguyên khi cập nhật
          ticket.expectedSeats = seatNumbers.length;
      
          res.render('admin/tickets/updatetickets', {
            ticket,
            seats
          });
        } catch (err) {
          console.error("❌ Lỗi renderUpdateTicket:", err);
          res.status(500).send("Lỗi server");
        }
      }
      
      async cancelTicket(req, res) {
        try {
          const { ticket_id } = req.params;
      
          const ticket = await Ticket.getTicketById(ticket_id);
          if (!ticket) {
            return res.status(404).send("Không tìm thấy vé.");
          }
      
          // Lấy danh sách ghế đã đặt của vé
          const seatIds = await Ticket.getSeatIdsByTicketId(ticket_id);
      
          // Cập nhật trạng thái ghế về AVAILABLE
          await Ticket.updateSeatStatus(seatIds, 'AVAILABLE');
      
          // Xóa khỏi bảng ticket_seats
          await Ticket.deleteSeatsOfTicket(ticket_id);
      
          // Cập nhật vé thành CANCELED
          await Ticket.updateTicketStatus(ticket_id, 'CANCELED');
      
          res.redirect('/admins/tickets');
        } catch (error) {
          console.error("❌ Lỗi khi hủy vé:", error);
          res.status(500).send("Lỗi khi hủy vé.");
        }
      }
      async removeTicket(req, res) {
        try {
          const { ticket_id } = req.params;
      
          const ticket = await Ticket.getTicketById(ticket_id);
          if (!ticket) {
            return res.status(404).send("Không tìm thấy vé.");
          }
      
          const seatIds = await Ticket.getSeatIdsByTicketId(ticket_id);
      
          // Trả lại ghế nếu còn
          if (seatIds.length > 0) {
            await Ticket.updateSeatStatus(seatIds, 'AVAILABLE');
            await Ticket.deleteSeatsOfTicket(ticket_id);
          }
      
          // Xóa vé
          await Ticket.deleteTicket(ticket_id);
      
          res.redirect('/admins/tickets');
        } catch (error) {
          console.error("❌ Lỗi khi xóa vé:", error);
          res.status(500).send("Lỗi khi xóa vé.");
        }
      }
      

      async searchTickets(req, res) {
        try {
          const { customer_name, customer_phone, ticket_code, status, booking_time } = req.query;
      
          const tickets = await Ticket.searchTickets({
            customer_name,
            customer_phone,
            ticket_code,
            status,
            booking_time,
          });
      
          // Tạo mô tả cho kết quả tìm kiếm
          const searchDescription = `Kết quả lọc theo: ${
            customer_name ? `Tên người đặt: "${customer_name}", ` : ''
          }${customer_phone ? `SĐT: "${customer_phone}", ` : ''}${
            ticket_code ? `Mã vé: "${ticket_code}", ` : ''
          }${status ? `Trạng thái: "${status}", ` : ''}${
            booking_time ? `Ngày đặt: "${booking_time}"` : ''
          }`.replace(/, $/, '');
      
          res.render('admin/tickets/tickets', {
            title: "Quản lý Vé đặt",
            tickets,
            customer_name,
            customer_phone,
            ticket_code,
            status,
            booking_time,
            searchDescription,
          });
        } catch (err) {
          console.error("❌ Lỗi khi tìm kiếm vé:", err);
          res.status(500).send("Lỗi server");
        }
      }
      async viewTicketDetail(req, res) {
        try {
          const { ticket_id } = req.params;
          const ticket = await Ticket.getTicketById(ticket_id);
      
          if (!ticket) {
            return res.status(404).send("Không tìm thấy vé.");
          }
      
          // 🔒 Thêm thông tin đã ẩn
          ticket.customer_phone_masked = maskPhone(ticket.customer_phone);
          ticket.customer_email_masked = maskEmail(ticket.customer_email);
      
          res.render('thong-tin-tai-khoan/chi-tiet-ve', { ticket });
        } catch (err) {
          console.error("❌ Lỗi khi hiển thị chi tiết vé:", err);
          res.status(500).send("Lỗi server");
        }
      }
      
      async findTicketByCodeAndPhone(req, res) {
        try {
            const { phone, 'ticket-code': ticket_code } = req.body;
    
            if (!phone || !ticket_code) {
                return res.render('traCuuVe', { error: 'Vui lòng nhập đầy đủ thông tin.', ticket: null });
            }
    
            const ticket = await Ticket.findTicketByCodeAndPhone(ticket_code, phone);
    
            if (!ticket) {
                return res.render('traCuuVe', { error: 'Không tìm thấy vé phù hợp.', ticket: null });
            }
    
            return res.render('thong-tin-tai-khoan/chi-tiet-ve', { ticket });
        } catch (error) {
            console.error("❌ Lỗi tra cứu vé:", error);
            res.status(500).render('traCuuVe', { error: 'Lỗi server khi tra cứu.', ticket: null });
        }
    }
    
}

module.exports = new TicketController();