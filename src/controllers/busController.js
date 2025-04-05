const Bus = require('../models/busModel');

class BusController {

    async getAllBus(req, res) {
        try {
            const buses = await Bus.getAllBus();
            res.status(200).json(buses);
        } catch (error) {
            console.log(error);
            res.status(500).json(error);
        }
    }

    async createBus(req, res) {
        try {
            const { license_plate, seat_capacity, bus_type } = req.body;
            
            if (!license_plate || !seat_capacity || !bus_type) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin xe' });
            }

            const result = await Bus.createBus(license_plate, seat_capacity, bus_type);

            res.status(201).json({ message: 'Thêm xe thành công', busId: result.insertId });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }

    async updateBus(req, res) {
        try {
            const { bus_id } = req.params;
            const { license_plate, seat_capacity, bus_type } = req.body;

            if (!license_plate || !seat_capacity || !bus_type) {
                return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin xe' });
            }

            const result = await Bus.updateBus(bus_id, license_plate, seat_capacity, bus_type);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy xe để cập nhật' });
            }

            res.status(200).json({ message: 'Cập nhật xe thành công' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }

    async deleteBus(req, res) {
        try {
            const {bus_id} = req.params;
            const result = await Bus.deleteBus(bus_id);
            if(result.affectedRows === 0) {
                return res.status(400).json({message: 'Không tìm thấy xe để xóa'})
            }
            res.status(200).json({message: 'Xóa xe thành công'});
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Lỗi server", error});
        }
    }
    async searchBus(req, res) {
        try {
            const { license_plate, bus_type } = req.query;

            const buses = await Bus.searchBus(license_plate, bus_type);

            res.status(200).json(buses);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Lỗi server", error });
        }
    }
    async renderAddBus(req, res) {
        res.render('admin/buses/addbuses', {
            title: 'Thêm xe mới'
        });
    }
    async createBusFromAdmin(req, res) {
        try {
            const { license_plate, bus_type } = req.body;
            const seat_capacity = 34;
    
            const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
    
            if (!license_plate || !bus_type) {
                return res.render('admin/buses/addbuses', {
                    title: 'Thêm xe mới',
                    error: 'Vui lòng nhập đầy đủ thông tin.',
                    data: req.body
                });
            }
    
            if (!licensePlateRegex.test(license_plate)) {
                return res.render('admin/buses/addbuses', {
                    title: 'Thêm xe mới',
                    error: 'Biển số xe không hợp lệ. Định dạng đúng: 29A-12345',
                    data: req.body
                });
            }
    
            // 🔥 Kiểm tra trùng biển số
            const existing = await Bus.getBusByLicensePlate(license_plate);
            if (existing.length > 0) {
                return res.render('admin/buses/addbuses', {
                    title: 'Thêm xe mới',
                    error: 'Biển số xe đã tồn tại trong hệ thống.',
                    data: req.body
                });
            }
    
            await Bus.createBus(license_plate, seat_capacity, bus_type);
            res.redirect('/admins/buses');
        } catch (error) {
            console.error(error);
            res.render('admin/buses/addbuses', {
                title: 'Thêm xe mới',
                error: 'Lỗi khi thêm xe. Vui lòng thử lại.',
                data: req.body
            });
        }
    }
    
    
    async renderAdminBuses(req, res) {
        try {
            const { license_plate, bus_type } = req.query;
    
            const buses = await Bus.searchBus(license_plate, bus_type);
    
            res.render('admin/buses/buses', {
                title: "Quản lý Xe",
                buses,
                license_plate,
                bus_type
            });
        } catch (error) {
            console.log(error);
            res.status(500).send("Lỗi khi tải danh sách xe");
        }
    }
    
    async renderEditBus(req, res) {
        try {
            const bus_id = req.params.id;
            const [bus] = await Bus.getBusById(bus_id); // bạn cần thêm hàm này trong model
            if (!bus) {
                return res.redirect('/admins/buses');
            }
    
            res.render('admin/buses/editbuses', {
                title: "Cập nhật xe",
                bus
            });
        } catch (error) {
            console.error(error);
            res.redirect('/admins/buses');
        }
    }
    async updateBusFromAdmin(req, res) {
        try {
            const bus_id = req.params.id;
            const { license_plate, bus_type } = req.body;
            const seat_capacity = 34;
    
            const licensePlateRegex = /^[0-9]{2}[A-Z]-[0-9]{5}$/;
    
            if (!license_plate || !bus_type) {
                return res.render('admin/buses/editbuses', {
                    title: 'Cập nhật xe',
                    error: 'Vui lòng nhập đầy đủ thông tin.',
                    bus: { id: bus_id, license_plate, bus_type, seat_capacity }
                });
            }
    
            if (!licensePlateRegex.test(license_plate)) {
                return res.render('admin/buses/editbuses', {
                    title: 'Cập nhật xe',
                    error: 'Biển số xe không hợp lệ. Định dạng đúng: 29A-12345',
                    bus: { id: bus_id, license_plate, bus_type, seat_capacity }
                });
            }
    
            // 🔥 Kiểm tra trùng biển số trừ xe hiện tại
            const existing = await Bus.getBusByLicensePlate(license_plate);
            if (existing.length > 0 && existing[0].id != bus_id) {
                return res.render('admin/buses/editbuses', {
                    title: 'Cập nhật xe',
                    error: 'Biển số xe đã tồn tại trong hệ thống.',
                    bus: { id: bus_id, license_plate, bus_type, seat_capacity }
                });
            }
    
            await Bus.updateBus(bus_id, license_plate, seat_capacity, bus_type);
            res.redirect('/admins/buses');
        } catch (error) {
            console.error(error);
            res.redirect('/admins/buses');
        }
    }
    
    async deleteBusFromAdmin(req, res) {
        try {
            const { id } = req.params;
            await Bus.deleteBus(id);
            res.redirect('/admins/buses');
        } catch (error) {
            console.error(error);
            res.redirect('/admins/buses');
        }
    }
    
}

module.exports = new BusController();
