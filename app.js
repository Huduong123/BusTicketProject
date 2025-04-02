// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path'); 
const port = 3000 || process.env.PORT; 
const { log } = require('console');
require('./src/utils/cronJobs');

//const e = require('express');

// Initialize the app and middleware
const app = express();
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'src', 'views'));
const methodOverride = require('method-override');
app.use(methodOverride('_method'));

const auth = require('./src/utils/auth');
// Middleware gán user từ JWT cookie cho mọi view
app.use((req, res, next) => {
    const token = req.cookies.userToken;
    const user = token ? auth.verifyAccessToken(token) : null;
    res.locals.user = user; // Biến này dùng được trong Pug
    next();
});
app.get('/', (req, res) => {
    res.render('index'); // Không cần truyền { user }
});



app.get("/tracuuve", (req, res) => res.render("traCuuVe"));
app.get("/lienhe", (req, res) => res.render("lienHe"));
app.get("/tintuc", (req, res) => res.render("tinTuc"));
app.get("/login", (req, res) => res.render("dangnhap"));
app.get("/register", (req, res) => res.render("dangki"));

app.get("/datve", (req, res) => {
    const tripData = req.query.trip ? JSON.parse(decodeURIComponent(req.query.trip)) : null;
    res.render('datve', { trip: tripData });
  });
app.get("/thanhtoan", (req, res) => res.render("thanhToan"));
const userRouter = require('./src/routes/userRoute');
app.use('/users', userRouter);

const tripRouter = require('./src/routes/tripRoute');
app.use('/trips', tripRouter);

const busRouter = require('./src/routes/busRoute');
app.use('/buses', busRouter);

const adminRouter = require('./src/routes/adminRoute');
app.use('/admins', adminRouter)

const routeRouter = require('./src/routes/routeRoute');
app.use('/', routeRouter);
const seatRouter = require('./src/routes/seatRoute');
app.use('/seats', seatRouter);

const location = require('./src/routes/locationRoute');
app.use('/locations', location);
const ticketRouter = require('./src/routes/ticketRoute');
app.use('/api/tickets', ticketRouter);

const paymentRouter = require('./src/routes/paymentRoute');
app.use('/api/payments', paymentRouter)

const profileRouter = require('./src/routes/profileRoute');
app.use('/thong-tin-tai-khoan', profileRouter)

const successRoute = require('./src/routes/successRoute');
app.use('/thongtin-vemua', successRoute);
app.listen(3000, () => {
    log(`Server is running on http://localhost:${port}`);
});


