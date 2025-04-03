// controllers/AdminDashboardController.js

exports.showDashboard = async (req, res) => {
    try {
      // Dữ liệu mẫu (sau này thay bằng từ database)
      const totalTrips = 120;
      const ticketsSold = 540;
      const monthlyRevenue = 50000000;
      const totalRoutes = 36;
  
      const upcomingTrips = [
        { code: "TRIP001", route: "Hà Nội → Đà Nẵng", time: "15:00 03/04/2025", status: "ON_TIME" },
        { code: "TRIP002", route: "TP.HCM → Nha Trang", time: "16:30 03/04/2025", status: "CANCELED" },
        { code: "TRIP003", route: "Huế → Hà Nội", time: "17:45 03/04/2025", status: "DELAYED" }
      ];
  
      const recentTickets = [
        { code: "VE12345", name: "Nguyễn Văn A", route: "Hà Nội → Đà Nẵng", price: 500000, time: "02/04/2025 21:15" },
        { code: "VE12346", name: "Trần Thị B", route: "TP.HCM → Nha Trang", price: 450000, time: "02/04/2025 21:30" }
      ];
  
      const revenueChart = {
        labels: ['27/03', '28/03', '29/03', '30/03', '31/03', '01/04', '02/04'],
        values: [10000000, 15000000, 12000000, 17000000, 9000000, 20000000, 13000000]
      };
  
      res.render('admin/dashboard', {
        totalTrips,
        ticketsSold,
        monthlyRevenue,
        totalRoutes,
        upcomingTrips,
        recentTickets,
        revenueChart
      });
    } catch (err) {
      console.error("Lỗi hiển thị dashboard:", err);
      res.status(500).send("Lỗi hiển thị dashboard.");
    }
  };
  