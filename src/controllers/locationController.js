const Location = require('../models/locationModel');

class LocationController {
    async getAllLocation(req, res) {
        try {
            const locations = await Location.getAllLocation();
            res.status(200).json(locations);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server', error });
        }
    }

    async getLocationById(req, res) {
        try {
            const { id } = req.params;
            const location = await Location.getLocationById(id);
            if (!location) {
                return res.status(404).json({ message: 'Không tìm thấy địa điểm' });
            }
            res.status(200).json(location);
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server', error });
        }
    }

    async addLocation(req, res) {
        try {
            const { name_location } = req.body;
            if (!name_location) {
                return res.status(400).json({ message: 'Tên địa điểm không được để trống' });
            }

            const insertId = await Location.addLocation(name_location);
            res.status(201).json({ message: 'Thêm địa điểm thành công', id: insertId });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server', error });
        }
    }

    async updateLocation(req, res) {
        try {
            const { id } = req.params;
            const { name_location } = req.body;

            if (!name_location) {
                return res.status(400).json({ message: 'Tên địa điểm không được để trống' });
            }

            const affectedRows = await Location.updateLocation(id, name_location);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy địa điểm để cập nhật' });
            }

            res.status(200).json({ message: 'Cập nhật địa điểm thành công' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server', error });
        }
    }

    async deleteLocation(req, res) {
        try {
            const { id } = req.params;

            const affectedRows = await Location.deleteLocation(id);
            if (affectedRows === 0) {
                return res.status(404).json({ message: 'Không tìm thấy địa điểm để xóa' });
            }

            res.status(200).json({ message: 'Xóa địa điểm thành công' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Lỗi server', error });
        }
    }
}

module.exports = new LocationController();
