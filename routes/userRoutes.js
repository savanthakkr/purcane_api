const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require("../middlewares/roleMiddleware");

const {addsellSugarcane,
    fetchsellSugarcane,
    addpurchaseSugarcane,
    fetchpurchaseSugarcane,
    addsellTransportcost,
    fetchOrdersAndPaymentsForAdmin,
    fetchsellTransportCost,
    addopenquantity,
    addpurchaseTransportCost,
    fetchpurchaseTransportCost,
    adddailyWages,
    fetchdailyWages,
    fetchProductAdmin,
    updateUserCart,
    fetchAllUsers,
    fetchorderdetails,
    fetchordersforadmin,
    UpdateView,
    fetchAllRevenueDetails,
    fetchTotalAmount,createPayment,fetchPaymentHistory,
    addDeisleCost,
    placeOrderByadmin,
    createInventory,
    AddRevenue,
    fetchProductAdminById,
    fetchInventory,
    fetchDeisleCost,fetchsellSugarcaneAllData,addPayment,fetchOrder, updateProductCart,placeOrder,deleteProductCart,fetchCartItems,addProductCart,loginUser,register,login,addCategory,fetchCategory,fetchCategorybyId,updateCategory,deleteCategory,fetchActiveCategory,addProduct,fetchProduct,
    fetchActiveProduct,deliverOrder,fetchAdminPayments,fetchAdminHomeData,createExpences,fetchExpences,fetchProfile,updateProfile,
    fetchUserPaymentHistory,shopregister,updateShop,fetchShops,assignUsertoShop,fetchShopdetails,createAttendance,fetchattendancbyuser,
    fetchattendancuserbyDate,createLeaves,fetchleavebyuser,fetchleaveuserbyDate,createBtoCExpense,fetchExpensebyuser,addShopProduct,
    updateShopProduct,fetchAllShopProduct,assignProducttoShop,updateassignProducttoShop,fetchAllAssignShopProduct,employeelogin,
    fetchEmpDetails,fetchAllAssignUser,addclosingquantity,fetchClosingQunatity
 } = userController; 

router.post('/login', login);

router.post('/AddRevenue', AddRevenue);
router.post('/fetchOrder', fetchOrder);
router.post('/createInventory', createInventory);
router.post('/fetchProductAdminById', fetchProductAdminById);
router.post('/placeOrderByadmin', placeOrderByadmin);
router.post('/UpdateView', UpdateView);
router.post('/updateUserCart', updateUserCart);
router.post('/fetchorderdetails', fetchorderdetails);
router.get('/fetchsellSugarcaneAllData', fetchsellSugarcaneAllData);
router.get('/fetchInventory', fetchInventory);
router.get('/fetchAllRevenueDetails', fetchAllRevenueDetails);
router.get('/fetchordersforadmin', fetchordersforadmin);
router.get('/fetchAllUsers', fetchAllUsers);
router.post('/addPayment', addPayment);

router.get('/fetchOrdersAndPaymentsForAdmin/:user_id', fetchOrdersAndPaymentsForAdmin);
router.post('/createPayment', createPayment);
router.post('/fetchTotalAmount', fetchTotalAmount);
router.post('/fetchPaymentHistory', fetchPaymentHistory);
router.post('/loginUser', loginUser);
router.post('/addopenquantity', addopenquantity);
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
router.get('/fetchProductAdmin', fetchProductAdmin);
router.get('/fetchActiveCategory', fetchActiveCategory);
router.post('/addProduct', addProduct);
router.post('/fetchProduct', fetchProduct);
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
router.post('/deliverOrder', deliverOrder);
router.get('/fetchAdminPayments', fetchAdminPayments);
router.get('/fetchAdminHomeData', fetchAdminHomeData);
router.post('/createExpences', createExpences);
router.get('/fetchExpences', fetchExpences);
router.post('/fetchProfile', fetchProfile);
router.post('/updateProfile', updateProfile);
router.post('/fetchUserPaymentHistory', fetchUserPaymentHistory);

//btoc
router.post('/shopregister', shopregister);
router.post('/updateShop', updateShop);
router.get('/fetchShops', fetchShops);
router.post('/assignUsertoShop', assignUsertoShop);
router.post('/fetchShopdetails', fetchShopdetails);
router.post('/createAttendance', createAttendance);
router.post('/fetchattendancbyuser', fetchattendancbyuser);
router.post('/fetchattendancuserbyDate', fetchattendancuserbyDate);
router.post('/createLeaves', createLeaves);
router.post('/fetchleavebyuser', fetchleavebyuser);
router.post('/fetchleaveuserbyDate', fetchleaveuserbyDate);
router.post('/createBtoCExpense', createBtoCExpense);
router.post('/fetchExpensebyuser', fetchExpensebyuser);
router.post('/addShopProduct', addShopProduct);
router.post('/updateShopProduct', updateShopProduct);
router.get('/fetchAllShopProduct', fetchAllShopProduct);
router.post('/assignProducttoShop', assignProducttoShop);
router.post('/updateassignProducttoShop', updateassignProducttoShop);
router.post('/fetchAllAssignShopProduct', fetchAllAssignShopProduct);
router.post('/employeelogin', employeelogin);
router.post('/fetchEmpDetails', fetchEmpDetails);
router.post('/fetchAllAssignUser', fetchAllAssignUser);
router.post('/addclosingquantity', addclosingquantity);
router.post('/fetchClosingQunatity', fetchClosingQunatity);

module.exports = router;
