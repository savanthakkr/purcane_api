const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require("../middlewares/roleMiddleware");

const {addsellSugarcane,
    fetchsellSugarcane,
    addpurchaseSugarcane,
    fetchpurchaseSugarcane,
    addsellTransportcost,
    fetchsellTransportCost,
    addpurchaseTransportCost,
    fetchpurchaseTransportCost,
    adddailyWages,
    fetchdailyWages,
    updateUserCart,
    fetchorderdetails,
    fetchordersforadmin,
    fetchTotalAmount,createPayment,fetchPaymentHistory,
    addDeisleCost,
    fetchDeisleCost,fetchsellSugarcaneAllData,addPayment,fetchOrder, updateProductCart,placeOrder,deleteProductCart,fetchCartItems,addProductCart,loginUser,register,login,addCategory,fetchCategory,fetchCategorybyId,updateCategory,deleteCategory,fetchActiveCategory,addProduct,fetchProduct,
    fetchActiveProduct
 } = userController; 

router.post('/login', login);
router.post('/fetchOrder', fetchOrder);
router.post('/updateUserCart', updateUserCart);
router.post('/fetchorderdetails', fetchorderdetails);
router.get('/fetchsellSugarcaneAllData', fetchsellSugarcaneAllData);
router.get('/fetchordersforadmin', fetchordersforadmin);
router.post('/addPayment', addPayment);
router.post('/createPayment', createPayment);
router.post('/fetchTotalAmount', fetchTotalAmount);
router.post('/fetchPaymentHistory', fetchPaymentHistory);
router.post('/loginUser', loginUser);
router.post('/register', register);
router.post('/placeOrder', placeOrder);
router.post('/fetchCartItems', fetchCartItems);
router.post('/addProductCart', addProductCart);
router.post('/updateProductCart', updateProductCart);
router.post('/deleteProductCart', deleteProductCart);
router.post('/addCategory', addCategory);
router.post('/fetchCategorybyId', fetchCategorybyId);
router.post('/updateCategory', updateCategory);
router.post('/deleteCategory', deleteCategory);
router.get('/fetchCategory', fetchCategory);
router.get('/fetchActiveCategory', fetchActiveCategory);
router.post('/addProduct', addProduct);
router.get('/fetchProduct', fetchProduct);
router.get('/fetchActiveProduct', fetchActiveProduct);
router.post('/addsellSugarcane', addsellSugarcane);
router.get('/fetchsellSugarcane', fetchsellSugarcane);
router.post('/addpurchaseSugarcane', addpurchaseSugarcane);
router.get('/fetchpurchaseSugarcane/:farmerName', fetchpurchaseSugarcane);
router.post('/addsellTransportcost', addsellTransportcost);
router.get('/fetchsellTransportCost', fetchsellTransportCost);
router.post('/addpurchaseTransportCost', addpurchaseTransportCost);
router.get('/fetchpurchaseTransportCost/:agentName', fetchpurchaseTransportCost);
router.post('/adddailyWages', adddailyWages);
router.get('/fetchdailyWages', fetchdailyWages);
router.post('/addDeisleCost', addDeisleCost);
router.get('/fetchDeisleCost', fetchDeisleCost);

module.exports = router;
