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
}

module.exports = new BusController();
