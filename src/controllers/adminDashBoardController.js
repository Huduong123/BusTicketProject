const Dashboard = require('../models/dashBoardModel');

class AdminDashboardController {
    async showDashboard(req, res) {
        try {
            const [
                totalTrips,
                ticketsSold,
                monthlyRevenue,
                totalRoutes,
                upcomingTrips,
                recentTickets,
                revenueData
            ] = await Promise.all([
                Dashboard.getTotalTrips(),
                Dashboard.getTicketsSold(),
                Dashboard.getMonthlyRevenue(),
                Dashboard.getTotalRoutes(),
                Dashboard.getUpcomingTrips(),
                Dashboard.getRecentTickets(),
                Dashboard.getRevenue7Days()
            ]);

            const revenueChart = {
                labels: revenueData.map(r => new Date(r.date).toLocaleDateString('vi-VN')),
                values: revenueData.map(r => r.revenue)
            };

            res.render('admin/dashboard', {
                totalTrips,
                ticketsSold,
                monthlyRevenue,
                formattedMonthlyRevenue: new Intl.NumberFormat('vi-VN').format(monthlyRevenue),
                totalRoutes,
                upcomingTrips: upcomingTrips.map(trip => ({
                    code: `TRIP${trip.id.toString().padStart(3, '0')}`,
                    route: `${trip.departure_location} → ${trip.destination_location}`,
                    time: new Date(trip.departure_time).toLocaleString('vi-VN'),
                    status: trip.status
                })),
                recentTickets: recentTickets.map(ticket => ({
                    code: ticket.ticket_code,
                    name: ticket.customer_name,
                    route: `${ticket.departure_location} → ${ticket.destination_location}`,
                    price: ticket.total_price_ticket,
                    time: new Date(ticket.booking_time).toLocaleString('vi-VN')
                })),
                revenueChart
            });
        } catch (error) {
            console.log("Lỗi dashboard:", error);
            res.status(500).send("Lỗi server");
        }
    }
}

module.exports = new AdminDashboardController();
