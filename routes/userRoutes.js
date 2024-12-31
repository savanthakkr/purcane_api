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
    editPurchaseSugarcane,
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
    deleteUser,
    editAdminPayment,
    createInventory,
    editSellSugarcane,
    AddRevenue,
    fetchB2CAllExpenses,
    editpurchaseTransportCost,
    editSellTransportCost,
    DeleteSell,
    DeleteRevenue,
    DeleteShopProduct,
    DeletePurchase,
    editExpenses,
    updateDailyWages,
    editRegister,
    DeleteShopExpenses,
    deleteDeisleCost,
    updateDieselCost,
    deleteExpences,
    deleteDailyWages,
    deleteProduct,
    fetchProductAdminById,
    fetchInventory,
    fetchDeisleCost,fetchsellSugarcaneAllData,addPayment,fetchOrder, updateProductCart,placeOrder,deleteProductCart,fetchCartItems,addProductCart,loginUser,register,login,addCategory,fetchCategory,fetchCategorybyId,updateCategory,deleteCategory,fetchActiveCategory,addProduct,fetchProduct,
    fetchActiveProduct,deliverOrder,fetchAdminPayments,fetchAdminHomeData,createExpences,fetchExpences,fetchProfile,updateProfile,
    fetchUserPaymentHistory,shopregister,updateShop,fetchShops,assignUsertoShop,fetchShopdetails,createAttendance,fetchattendancbyuser,
    fetchattendancuserbyDate,createLeaves,fetchleavebyuser,fetchleaveuserbyDate,createBtoCExpense,fetchExpensebyuser,addShopProduct,
    updateShopProduct,fetchAllShopProduct,assignProducttoShop,updateassignProducttoShop,fetchAllAssignShopProduct,employeelogin,
    fetchEmpDetails,fetchAllAssignUser,addclosingquantity,fetchClosingQunatity,UpdateRevenue,fetchbtocpurchase,fetchbtocsell,
    updateUserStatus,fetchProductbyID,fetchShopByID,updateProduct,updateShopByID,fetchAllUsersbyType,fetchTotalCostShop,
    createOrderSession,handleJuspayResponse
 } = userController; 

router.post('/login', login);

router.post('/editExpenses', editExpenses);

router.post('/updateDailyWages', updateDailyWages);
router.post('/updateDieselCost', updateDieselCost);

router.post('/DeleteShopExpenses', DeleteShopExpenses);
router.post('/DeleteShopProduct', DeleteShopProduct);

router.post('/DeleteSell', DeleteSell);
router.post('/DeletePurchase', DeletePurchase);

router.post('/DeleteRevenue', DeleteRevenue);
router.post('/deleteExpences', deleteExpences);
router.post('/deleteDeisleCost', deleteDeisleCost);
router.post('/deleteDailyWages', deleteDailyWages);
router.post('/editSellTransportCost', editSellTransportCost);
router.post('/editpurchaseTransportCost', editpurchaseTransportCost);
router.post('/editRegister', editRegister);
router.post('/deleteUser', deleteUser);
router.post('/deleteProduct', deleteProduct);
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
router.get('/fetchB2CAllExpenses', fetchB2CAllExpenses);
router.get('/fetchAllUsers', fetchAllUsers);
router.post('/addPayment', addPayment);
router.post('/editAdminPayment', editAdminPayment);

router.post('/fetchOrdersAndPaymentsForAdmin', fetchOrdersAndPaymentsForAdmin);
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
router.post('/editPurchaseSugarcane', editPurchaseSugarcane);
router.post('/editSellSugarcane', editSellSugarcane);
router.get('/fetchsellSugarcane', fetchsellSugarcane);
router.post('/addpurchaseSugarcane', addpurchaseSugarcane);
router.get('/fetchpurchaseSugarcane/:farmerName', fetchpurchaseSugarcane);
router.post('/addsellTransportcost', addsellTransportcost);
router.get('/fetchsellTransportCost', fetchsellTransportCost);
router.post('/addpurchaseTransportCost', addpurchaseTransportCost);
router.post('/fetchpurchaseTransportCost', fetchpurchaseTransportCost);
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
router.post('/updateUserStatus', updateUserStatus);
router.post('/fetchProductbyID', fetchProductbyID);
router.post('/fetchShopByID', fetchShopByID);
router.post('/updateProduct', updateProduct);
router.post('/updateShopByID', updateShopByID);
router.post('/fetchAllUsersbyType', fetchAllUsersbyType);

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
router.post('/UpdateRevenue', UpdateRevenue);
router.post('/fetchbtocpurchase', fetchbtocpurchase);
router.post('/fetchbtocsell', fetchbtocsell);
router.post('/fetchTotalCostShop', fetchTotalCostShop);
router.post('/createOrderSession', createOrderSession);
router.post('/handleJuspayResponse', handleJuspayResponse);

module.exports = router;
