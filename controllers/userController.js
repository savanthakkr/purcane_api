const bcrypt = require('bcrypt');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middlewares/authMiddleware');
const fs = require('fs');
const path = require('path');

const otpGenerator = require('otp-generator');
const { broadcastMessage } = require('./soketController');

const nodemailer = require('nodemailer');
const { error, log } = require('console');
const QRCode = require('qrcode');
const multer = require('multer');
// Set up storage with multer to store images in the 'uploads' directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });
const uploadMiddleware = upload.single('image');

// Create the 'uploads' directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const saveBase64File = (base64String, folderPath) => {
  // Check if the base64 string includes the prefix
  let matches = base64String.match(/^data:(.+);base64,(.+)$/);
  
  if (!matches) {
    // If the prefix is missing, assume the entire string is base64 without the metadata
    matches = [null, 'application/octet-stream', base64String];
  }

  if (matches.length !== 3) {
      throw new Error('Invalid base64 string');
  }

  const ext = matches[1].split('/')[1]; // get the file extension
  const buffer = Buffer.from(matches[2], 'base64'); // decode base64 string

  const fileName = `${Date.now()}.${ext}`;
  const filePath = path.join(folderPath, fileName);

  fs.writeFileSync(filePath, buffer); // save the file to the uploads folder

  return filePath; // return the file path for saving in the database
};




function AddMinutesToDate(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}
const otpganrate = Math.floor(100000 + Math.random() * 900000);
const now = new Date();
const expiration_time = AddMinutesToDate(now, 10);

const genrateOTP = () => {
  const payload = {
    otpganrate,
    now,
    expiration_time,
  };
  return (payload);

}
const otpPassword = Math.floor(1000 + Math.random() * 9000);

function generateOTPS() {
  const payload = {
    otpPassword,
    now,
    expiration_time,
  };
  return (payload);
}

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'sponda.netclues@gmail.com',
      pass: 'qzfm wlmf ukeq rvvb'
    }
  });

  const mailOptions = {
    from: 'sponda.netclues@gmail.com',
    to: options.to,
    subject: options.subject,
    html: options.message,
  };

  await transporter.sendMail(mailOptions);
};

//admin apis

const login = async (req, res) => {
  try {
    const { email,password } = req.body;

    const [existingUser] = await sequelize.query('SELECT * FROM admin WHERE email = ? AND password = ? AND status = ?',
      { replacements: [email,password,'0'], type: QueryTypes.SELECT });
    if (existingUser) {
      return res.status(200).send({ error: false, message: 'Login success!', Login: existingUser });
    } else {
      return res.status(404).send({ error: true, message: 'Email or Password is wrong!' });
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error
    });
  }
};

const employeelogin = async (req, res) => {
  try {
    const { oMobile,password } = req.body;

    const [existingUser] = await sequelize.query('SELECT * FROM register WHERE oNumber = ? AND password = ? AND status = ?',
      { replacements: [oMobile,password,'0'], type: QueryTypes.SELECT });
    if (existingUser) {
      if(existingUser.shop_id != null){
        return res.status(200).send({ error: false, message: 'Login success!', Login: existingUser });
      } else {
        return res.status(404).send({ error: true, message: 'You have not assign at any shop' });
      }
      
    } else {
      return res.status(404).send({ error: true, message: 'Email or Password is wrong!' });
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error
    });
  }
};

const addCategory = async (req, res) => {
  try {
    const { cname,cImage } = req.body;

    const existingCategory = await sequelize.query(
      'SELECT * FROM category WHERE LOWER(cat_name) = LOWER(?)',
      {
        replacements: [cname],
        type: QueryTypes.SELECT
      }
    );

    if (existingCategory.length === 0) {
      const imagePath = saveBase64File(cImage, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO category (cat_name, cat_image) VALUES (?, ?)',
        {
          replacements: [cname,imagePath],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Category added successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Category already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Category not added!!!' });
  }
};

const fetchCategory = async (req, res) => {
  try {

    const categoryList = await sequelize.query('SELECT * FROM category',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(categoryList.length > 0){
      return res.status(200).send({ error: false, message: 'Category Fetch Successfully', Category: categoryList });
    } else {
      return res.status(404).send({ error: true, message: 'Category not found', Category: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Category not found',
      error: true
    });
  }
};

const fetchActiveCategory = async (req, res) => {
  try {

    const categoryList = await sequelize.query('SELECT * FROM category WHERE status = ?',
      { replacements: ['0'], type: QueryTypes.SELECT }); 

    if(categoryList.length > 0){
      return res.status(200).send({ error: false, message: 'Category Fetch Successfully', Category: categoryList });
    } else {
      return res.status(404).send({ error: true, message: 'Category not found', Category: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Category not found',
      error: true
    });
  }
};

const fetchCategorybyId = async (req, res) => {
  try {
    const { cId } = req.body;

    const categoryList = await sequelize.query('SELECT * FROM category WHERE id = ?',
      { replacements: [cId], type: QueryTypes.SELECT }); 

    if(categoryList.length > 0){
      return res.status(200).send({ error: false, message: 'Category Fetch Successfully', Category: categoryList });
    } else {
      return res.status(404).send({ error: true, message: 'Category not found', Category: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Category not found',
      error: true
    });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { cId,cname,cImage,status } = req.body;

    const existingCategory = await sequelize.query(
      'SELECT * FROM category WHERE id != ? AND LOWER(cat_name) = LOWER(?)',
      {
        replacements: [cId,cname],
        type: QueryTypes.SELECT
      }
    );

    if (existingCategory.length === 0) {

      const categoryDetails = await sequelize.query(
        'SELECT * FROM category WHERE id = ?',
        {
          replacements: [cId],
          type: QueryTypes.SELECT
        }
      );

      var imagePath = "";

      if(cImage != ""){
        imagePath = saveBase64File(cImage, 'uploads');
      } else {
        imagePath = categoryDetails[0].cat_image;
      }
      

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'UPDATE category SET cat_name = ?, cat_image  = ?, status = ? WHERE id = ?',
        {
          replacements: [cname,imagePath,status,cId],
          type: QueryTypes.UPDATE
        }
      );

      res.status(200).json({ error: false, message: 'Category update successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Category already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Category not updated!!!' });
  }
};


const updateProduct = async (req, res) => {
  try {
    const { pId,cId,pname,pdesc,pimage,pprice,sellPrice,pqunt } = req.body;

    const existingProduct = await sequelize.query(
      'SELECT * FROM product WHERE category_id = ? AND LOWER(p_name) = LOWER(?) AND id != ?',
      {
        replacements: [cId,pname,pId],
        type: QueryTypes.SELECT
      }
    );

    if (existingProduct.length === 0) {

      const categoryDetails = await sequelize.query(
        'SELECT * FROM product WHERE id = ?',
        {
          replacements: [pId],
          type: QueryTypes.SELECT
        }
      );

      var imagePath = "";

      if(pimage != ""){
        imagePath = saveBase64File(pimage, 'uploads');
      } else {
        imagePath = categoryDetails[0].p_image;
      }
      

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'UPDATE product SET category_id = ?, p_name = ?,p_desc = ?,p_image = ?,p_price = ?,sellPrice = ?,availble_quntity = ? WHERE id = ?',
        {
          replacements: [cId,pname,pdesc,imagePath,pprice,sellPrice,pqunt,pId],
          type: QueryTypes.UPDATE
        }
      );

      res.status(200).json({ error: false, message: 'Product update successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Product already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not updated!!!' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { cId } = req.body;

    const result = await sequelize.query('DELETE FROM category WHERE id = ?',
      { replacements: [cId], type: QueryTypes.DELETE }); 

      return res.status(200).send({ error: false, message: 'Category Deleted Successfully'});

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Category not found',
      error: true
    });
  }
};

const addProduct = async (req, res) => {
  try {
    const { cId,pname,pdesc,pimage,pprice,sellPrice,pqunt } = req.body;

    const existingProduct = await sequelize.query(
      'SELECT * FROM product WHERE category_id = ? AND LOWER(p_name) = LOWER(?)',
      {
        replacements: [cId,pname],
        type: QueryTypes.SELECT
      }
    );

    if (existingProduct.length === 0) {
      const imagePath = saveBase64File(pimage, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO product (category_id, p_name,p_desc,p_image,p_price,sellPrice,availble_quntity) VALUES (?,?,?,?,?,?,?)',
        {
          replacements: [cId,pname,pdesc,imagePath,pprice,sellPrice,pqunt],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Product added successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Product already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not added!!!' });
  }
};

const fetchProductAdmin = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT product.*,category.id as CID,category.cat_name as CNAME FROM product INNER JOIN category ON product.category_id = category.id',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', Product: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', Product: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const fetchProductbyID = async (req, res) => {
  try {

    const { product_id } = req.body;

    const productList = await sequelize.query('SELECT product.*,category.id as CID,category.cat_name as CNAME FROM product INNER JOIN category ON product.category_id = category.id WHERE product.id = ?',
      { replacements: [product_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', Product: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', Product: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const fetchProduct = async (req, res) => {
  try {
    const { userId } = req.body;

    // Query to fetch product details and price logic
    const productList = await sequelize.query(`
      SELECT product.*, category.id AS CID, category.cat_name AS CNAME,
        CASE 
          WHEN register.sellPriceStatus = 1 THEN product.sellPrice
          ELSE product.p_price
        END AS final_price
      FROM product
      INNER JOIN category ON product.category_id = category.id
      INNER JOIN register ON register.id = :userId
      WHERE product.status = :status
    `, 
    {
      replacements: { userId, status: '0' }, // Use named replacements
      type: QueryTypes.SELECT
    });

    if (productList.length > 0) {
      return res.status(200).send({
        error: false,
        message: 'Product Fetch Successfully',
        Product: productList
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Product not found',
        Product: []
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};


const fetchActiveProduct = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT product.*,category.id as CID,category.cat_name as CNAME FROM product INNER JOIN category ON product.category_id = category.id WHERE product.status = ?',
      { replacements: ['0'], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', Product: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', Product: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};



const register = async (req, res) => {
  try {
    const { name,nName, oMobile,eMobile,landmark,sImage,block,password,type } = req.body;

    const existingCategory = await sequelize.query(
      'SELECT * FROM register WHERE oNumber = ?',
      {
        replacements: [oMobile],
        type: QueryTypes.SELECT
      }
    );

    if (existingCategory.length === 0) {
      const imagePath = saveBase64File(sImage, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO register (name, nName,oNumber,eNumber,landmark,sImages,block,password,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        {
          replacements: [name,nName,oMobile,eMobile,landmark,imagePath,block,password,type],
          type: QueryTypes.INSERT
        }
      );

      const userId = result[0];

      // Generate and send OTP
      // await sendOTP(mobileNumber);
      res.status(200).json({ error: false, message: 'User registered successfully', userId: userId });
    } else {
      res.status(400).json({ error: true, message: 'User already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'User not added!!!' });
  }
};

const loginUser = async (req, res) => {
  try {
    const { oMobile,password } = req.body;

    const [existingUser] = await sequelize.query('SELECT * FROM register WHERE oNumber = ? AND password = ? AND status = ?',
      { replacements: [oMobile,password,'0'], type: QueryTypes.SELECT });
    if (existingUser) {
      return res.status(200).send({ error: false, message: 'Login success!', Login: existingUser });
    } else {
      return res.status(404).send({ error: true, message: 'Email or Password is wrong!' });
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error
    });
  }
};

const fetchProfile = async (req, res) => {
  try {
    const { userId } = req.body;

    const [existingUser] = await sequelize.query('SELECT * FROM register WHERE id = ?',
      { replacements: [userId], type: QueryTypes.SELECT });
    if (existingUser) {
      return res.status(200).send({ error: false, message: 'Login success!', Login: existingUser });
    } else {
      return res.status(404).send({ error: true, message: 'Email or Password is wrong!' });
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const {userId, name,nName,eMobile,landmark,sImage,block } = req.body;

    var imagePath = "";

      // Insert new jobseeker into the database
      if(sImage){
        imagePath = saveBase64File(sImage, 'uploads');
      } else {
        const existingCategory = await sequelize.query(
          'SELECT * FROM register WHERE id = ?',
          {
            replacements: [userId],
            type: QueryTypes.SELECT
          }
        );
        imagePath = existingCategory[0].sImages;
      }

      const result = await sequelize.query(
        'UPDATE register SET name = ?, nName = ?, eNumber = ?, landmark = ?, sImages = ?, block = ? Where id = ?',
        {
          replacements: [name,nName,eMobile,landmark,imagePath,block,userId],
          type: QueryTypes.INSERT
        }
      );
      res.status(200).json({ error: false, message: 'Profile update successfully' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'User not added!!!' });
  }
};

const fetchCartItems = async (req, res) => {
  try {
    const { user_id } = req.body;

    console.log(`Fetching cart items for user_id: ${user_id}`);

    // Fetch cart items for the user
    const UserCartResult = await sequelize.query(
      'SELECT * FROM cart WHERE user_id = ? AND status = ?',
      { replacements: [user_id, '0'], type: QueryTypes.SELECT }
    );


    

    // Ensure UserCart is always an array
    const UserCart = Array.isArray(UserCartResult) ? UserCartResult : [UserCartResult];

    // Log the fetched cart items
    console.log('UserCart:', UserCart);

    if (UserCart.length === 0) {
      return res.status(200).json({
        error: false,
        message: "No items in the cart",
        CartDetails: [],
      });
    }

    // Fetch all products in parallel
    const productPromises = UserCart.map(async (cart) => {
      const productResult = await sequelize.query(
        'SELECT * FROM product WHERE id = ?',
        {
          replacements: [cart.product_id],
          type: QueryTypes.SELECT
        }
      );

      // Ensure products is always an array
      const products = Array.isArray(productResult) ? productResult : [productResult];

      // Log the fetched products for each cart item
      console.log(`Products for cart item ${cart.product_id}:`, products);

      cart.products = products;
      return cart;
    });

    const updatedCart = await Promise.all(productPromises);

    // Return the updated cart details
    res.status(200).json({
      error: false,
      message: "Data Fetch",
      CartDetails: updatedCart,
    });
  } catch (error) {
    console.error('Error fetching cart items:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};


const placeOrder = async (req, res) => {
  const { userId, price } = req.body;

  try {

    const result = await sequelize.query(
      'INSERT INTO orders (user_id, tPrice) VALUES (?, ?)',
      { replacements: [userId, price], type: QueryTypes.INSERT }
    );


    if (result && result[0] != null) {
      const insertedId = result[0];
      const resultUpdate = await sequelize.query(
        'UPDATE cart SET status = 1, order_id = ? WHERE user_id = ? AND status = 0',
        { replacements: [insertedId, userId], type: QueryTypes.UPDATE }
      );
  
      res.status(200).json({ message: 'Order created!', error: false });
    } else {
      res.status(400).json({ message: 'Order not create', error: true });
    }
  } catch (error) {
    console.error('Error placing order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


const addPayment = async (req, res) => {
  const { userId, price, notes } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const UserOrderResult = await sequelize.query(
      `SELECT id FROM orders 
       WHERE user_id = ? 
       AND status = ? 
       AND created_at >= NOW() - INTERVAL 1 HOUR`,
      {
        replacements: [userId, '1'],
        type: QueryTypes.SELECT
      }
    );

    if (UserOrderResult.length === 0) {
      return res.status(400).json({ message: 'No orders found', error: true });
    }

    // Loop through the results and insert into paymentDone
    for (const order of UserOrderResult) {
      const result = await sequelize.query(
        'INSERT INTO paymentdone (user_id, order_id, amount,notes, status) VALUES (?, ?, ?,?,?)',
        { replacements: [userId, order.id, price,notes,'0'], type: QueryTypes.INSERT }
      );
      

      // Update the status in the 'orders' table
      await sequelize.query(
        'UPDATE orders SET status = 0 WHERE user_id = ? AND id = ? AND status = 1',
        { replacements: [userId, order.id], type: QueryTypes.UPDATE }
      );
    }

    res.status(200).json({ message: 'Payment added and orders updated!', error: false });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};



const fetchOrder = async (req, res) => {
  const { user_id } = req.body; // Assuming userId is passed as a URL parameter

  try {
    // Fetch orders, related cart items, and product details for the given user
    const ordersWithCartAndProducts = await sequelize.query(
      `
      SELECT o.*, c.*, p.*
      FROM orders o
      LEFT JOIN cart c ON o.id = c.order_id
      LEFT JOIN product p ON c.product_id = p.id
      WHERE o.user_id = ? AND o.status = ?
      `,
      { replacements: [user_id, "2"], type: QueryTypes.SELECT }
    );

    if (ordersWithCartAndProducts.length > 0) {
      // Group cart items and their product details by order_id
      const groupedOrders = ordersWithCartAndProducts.reduce((acc, row) => {
        const { order_id, tPrice, created_at, status, ...cartAndProductData } = row;

        if (!acc[order_id]) {
          acc[order_id] = {
            order_id,
            tPrice,
            created_at,
            status,
            cartItemsOrder: []
          };
        }

        // If there's cart data (cart table could be empty in some cases), push cart and product items
        if (cartAndProductData.id) {
          acc[order_id].cartItemsOrder.push(
            {
              id: cartAndProductData.id,
              quantity: cartAndProductData.quantity,
              price: cartAndProductData.price,
              status: cartAndProductData.status,
              product_id: cartAndProductData.product_id,
              name: cartAndProductData.p_name,
              description: cartAndProductData.p_desc,
              pPrice: cartAndProductData.	p_price,
              imageUrl: cartAndProductData.	p_image
            }
          );
        }

        return acc;
      }, {});

      // Convert object back to array format
      const orders = Object.values(groupedOrders);

      res.status(200).json({ orders, error: false });
    } else {
      res.status(404).json({ message: 'No orders found for this user', error: true });
    }
  } catch (error) {
    console.error('Error fetching orders, cart items, and products:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};


const addProductCart = async (req, res) => {
  try {
    const {  product_id, user_id, quantity, price} = req.body;

    const [existingUserCart] = await sequelize.query('SELECT * FROM cart WHERE product_id = ? AND user_id = ? AND status = ?',
      { replacements: [product_id,user_id, 0], type: QueryTypes.SELECT });


    if (!existingUserCart) {
      const result = await sequelize.query(
        'INSERT INTO cart (product_id, user_id,quantity,price) VALUES (?,?,?,?)',
        {
          replacements: [product_id, user_id,quantity,price],
          type: QueryTypes.INSERT
        }
      );
  
      if (result && result[0] != null) {
        res.status(200).json({ message: 'Product added', error: false });
      } else {
        res.status(400).json({ message: 'Product not added', error: true });
      }
    } else {
      return res.status(404).send({ error: true, message: 'Product already exist in cart!' });
    }
  } catch (error) {
    console.error('Error creating Category:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};




const updateProductCart = async (req, res) => {
  try {
    const { cart_id, quantity, price } = req.body;

    console.log(req.body);
    
    const result = await sequelize.query(
      'UPDATE cart SET quantity = ? , price = ? WHERE id = ?',
      {
        replacements: [quantity, price, cart_id],
        type: QueryTypes.UPDATE
      }
    );
    res.status(200).json({ message: 'Cart update', error: false });
  } catch (error) {
    console.error('Error creating Category:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};

const deleteProductCart = async (req, res) => {
  try {
    const { cartId } = req.body;
    if (!cartId) {
      return res.status(400).json({ message: 'Cart ID is required', error: true });
    }
    const result = await sequelize.query(
      'DELETE FROM cart WHERE id = ? AND status = ?',
      {
        replacements: [cartId,'0'],
        type: QueryTypes.DELETE,
      }
    );
    res.status(200).json({ message: 'Item deleted successfully', error: false });
  } catch (error) {
    console.error('Error deleting requirement:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
}; 


const addsellSugarcane = async (req, res) => {
  try {
    const { agent_name,farmer_name,weight,rate,v_name,driver_name,receipt,amount } = req.body;

      const imagePath = saveBase64File(receipt, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO sell_sugarcane (agent_name,farmer_name,weight,rate,v_name,driver_name,receipt,amount) VALUES (?,?,?,?,?,?,?,?)',
        {
          replacements: [agent_name,farmer_name,weight,rate,v_name,driver_name,imagePath,amount],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};


const fetchsellSugarcane = async (req, res) => {
  try {
    const productList = await sequelize.query(`
      SELECT 
        ss.farmer_name,
        SUM(ss.weight) AS total_weight,
        AVG(ss.rate) AS average_rate,
        SUM(ss.amount) AS total_sell_amount,
        COALESCE(SUM(ss.amount) - COALESCE(SUM(ps.amount), 0), SUM(ss.amount)) AS final_amount
      FROM sell_sugarcane ss
      LEFT JOIN purchase_sugarcane ps 
        ON ss.farmer_name = ps.agent_name
      GROUP BY ss.farmer_name
    `, {
      type: QueryTypes.SELECT
    });

    if (productList.length > 0) {
      // Convert each value in the result to a string
      const productListAsStrings = productList.map(item => ({
        farmer_name: item.farmer_name.toString(),
        total_weight: item.total_weight.toString(),
        average_rate: item.average_rate.toString(),
        total_sell_amount: item.total_sell_amount.toString(),
        final_amount: item.final_amount.toString()
      }));

      return res.status(200).send({
        error: false,
        message: 'Data Fetch Successfully',
        SellSugarCaneAvg: productListAsStrings
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found',
        SellSugarCaneAvg: []
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


const fetchsellSugarcaneAllData = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM sell_sugarcane',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', SellSugarCane: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', SellSugarCane: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const addpurchaseSugarcane = async (req, res) => {
  try {
    const { agent_name,amount,transaction_id,payment_mode,payment_date,receipt } = req.body;

      const imagePath = saveBase64File(receipt, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO purchase_sugarcane (agent_name,amount,transaction_id,payment_mode,payment_date,receipt) VALUES (?,?,?,?,?,?)',
        {
          replacements: [agent_name,amount,transaction_id,payment_mode,payment_date,imagePath],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};

const fetchpurchaseSugarcaneAll = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM purchase_sugarcane',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', PurchaseSugarCane: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', PurchaseSugarCane: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


const fetchpurchaseSugarcane = async (req, res) => {
  const { farmerName } = req.params; // Get farmer name from request parameters

  try {
    // Fetch data from the purchase_sugarcane table
    const purchaseData = await sequelize.query(`
      SELECT 
        'payment_made' AS source, 
        agent_name AS name, 
        NULL AS agent_name_sell, 
        NULL AS weight, 
        NULL AS rate, 
        NULL AS v_name, 
        NULL AS driver_name, 
        receipt, 
        amount, 
        payment_mode, 
        transaction_id, 
        payment_date AS cDate
      FROM purchase_sugarcane 
      WHERE agent_name = ?
      ORDER BY cDate DESC
    `, { 
      replacements: [farmerName], 
      type: QueryTypes.SELECT 
    });

    // Fetch data from the sell_sugarcane table
    const sellData = await sequelize.query(
      `SELECT 
        'purchase' AS source, 
        farmer_name AS name, 
        agent_name AS agent_name_sell, 
        weight, 
        rate, 
        v_name, 
        driver_name, 
        receipt, 
        amount, 
        NULL AS payment_mode, 
        NULL AS transaction_id, 
        NULL AS payment_date, 
        DATE_FORMAT(created_at, '%d/%m/%Y') AS cDate
      FROM sell_sugarcane 
      WHERE farmer_name = ?
      ORDER BY cDate DESC`,
      { 
        replacements: [farmerName], 
        type: QueryTypes.SELECT 
      }
    );
    

    // Now merge both datasets by created_at (or another field if necessary)
    const mergedData = [...purchaseData, ...sellData].sort((a, b) => {
      const dateA = new Date(a.cDate.split('/').reverse().join('-')); // Convert 'MM/DD/YYYY' to 'YYYY-MM-DD'
      const dateB = new Date(b.cDate.split('/').reverse().join('-')); // Convert 'MM/DD/YYYY' to 'YYYY-MM-DD'
      return dateB - dateA; // Sort in descending order
    });
    

    // Process data to ensure each date has entries for both sources
    const processedData = [];
    const dateMap = new Map();

    mergedData.forEach(item => {
      const dateKey = item.cDate; // Format date as YYYY-MM-DD
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { purchase: null, payment_made: null });
      }

      if (item.source === 'purchase') {
        dateMap.get(dateKey).purchase = item;
      } else if (item.source === 'payment_made') {
        dateMap.get(dateKey).payment_made = item;
      }
      
    console.log(dateKey);
    });


    

    // Convert map to array and add blank rows where needed
    dateMap.forEach((value, key) => {
      const purchaseEntry = value.purchase || {
        source: 'purchase',
        name: null,
        agent_name_sell: null,
        weight: null,
        rate: null,
        v_name: null,
        driver_name: null,
        receipt: null,
        amount: null,
        payment_mode: null,
        transaction_id: null,
        payment_date: null,
        cDate: key
      };

      const paymentMadeEntry = value.payment_made || {
        source: 'payment_made',
        name: null,
        agent_name_sell: null,
        weight: null,
        rate: null,
        v_name: null,
        driver_name: null,
        receipt: null,
        amount: null,
        payment_mode: null,
        transaction_id: null,
        payment_date: null,
        cDate: key
      };

      processedData.push(purchaseEntry, paymentMadeEntry);
    });

    // If data is found
    if (processedData.length > 0) {
      return res.status(200).send({
        error: false,
        message: 'Data fetched successfully',
        mergedData: processedData
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found for the given farmer',
        mergedData: []
      });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({
      message: 'Internal server error',
      error: true
    });
  }
};




const addsellTransportcost = async (req, res) => {
  try {
    const { agent_name,weight,rate,v_number,d_name,receipt,amount } = req.body;

      const imagePath = saveBase64File(receipt, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO transportcost_sell (agent_name,wieght,rate,v_number,d_name,receipt,amount) VALUES (?,?,?,?,?,?,?)',
        {
          replacements: [agent_name,weight,rate,v_number,d_name,imagePath,amount],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};


const fetchsellTransportCostAll = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM transportcost_sell',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', SellTransportCost: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', SellTransportCost: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


const fetchsellTransportCost = async (req, res) => {
  try {
    const productList = await sequelize.query(`
      SELECT 
        ts.agent_name,
        SUM(ts.wieght) AS total_weight,
        AVG(ts.rate) AS average_rate,
        SUM(ts.amount) AS total_sell_amount,
        COALESCE(SUM(ts.amount) - COALESCE(tp.total_purchase_amount, 0), SUM(ts.amount)) AS final_amount
      FROM transportcost_sell ts
      LEFT JOIN (
        SELECT 
          agent_name,
          SUM(amount) AS total_purchase_amount
        FROM transportcost_purchase
        GROUP BY agent_name
      ) tp ON ts.agent_name = tp.agent_name
      GROUP BY ts.agent_name
    `, {
      type: QueryTypes.SELECT
    });

    if (productList.length > 0) {
      const productListAsStrings = productList.map(item => ({
        agent_name: item.agent_name.toString(),
        total_weight: item.total_weight.toString(),
        average_rate: item.average_rate.toString(),
        total_sell_amount: item.total_sell_amount.toString(),
        final_amount: item.final_amount.toString()
      }));

      return res.status(200).send({
        error: false,
        message: 'Data Fetch Successfully',
        SellTransportAvgCost: productListAsStrings
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found',
        SellTransportCost: []
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Internal Server Error',
      error: true
    });
  }
};



const addpurchaseTransportCost = async (req, res) => {
  try {
    const { agent_name,amount,transaction_id,payment_mode,payment_date,receipt } = req.body;

      const imagePath = saveBase64File(receipt, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO transportcost_purchase (agent_name,amount,transaction_id,payment_mode,payment_date,receipt) VALUES (?,?,?,?,?,?)',
        {
          replacements: [agent_name,amount,transaction_id,payment_mode,payment_date,imagePath],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};

const fetchpurchaseTransportCost = async (req, res) => {
  const { agentName } = req.body; // Get farmer name from request parameters

  try {
    // Fetch data from the purchase_sugarcane table
    const purchaseData = await sequelize.query(`
      SELECT 
        'payment_made' AS source, 
        agent_name AS name, 
        NULL AS wieght, 
        NULL AS rate, 
        NULL AS v_number, 
        NULL AS d_name, 
        receipt, 
        amount, 
        payment_mode, 
        transaction_id, 
        payment_date AS cDate
      FROM transportcost_purchase 
      WHERE agent_name = ?
      ORDER BY cDate DESC
    `, { 
      replacements: [agentName], 
      type: QueryTypes.SELECT 
    });

    // Fetch data from the sell_sugarcane table
    const sellData = await sequelize.query(
      `SELECT 
        'purchase' AS source, 
        agent_name AS name, 
        wieght, 
        rate, 
        v_number, 
        d_name, 
        receipt, 
        amount, 
        NULL AS payment_mode, 
        NULL AS transaction_id, 
        NULL AS payment_date, 
        DATE_FORMAT(created_at, '%d/%m/%Y') AS cDate
      FROM transportcost_sell 
      WHERE agent_name = ?
      ORDER BY cDate DESC`,
      { 
        replacements: [agentName], 
        type: QueryTypes.SELECT 
      }
    );
    

    // Now merge both datasets by created_at (or another field if necessary)
    const mergedData = [...purchaseData, ...sellData].sort((a, b) => {
      const dateA = new Date(a.cDate.split('/').reverse().join('-')); // Convert 'MM/DD/YYYY' to 'YYYY-MM-DD'
      const dateB = new Date(b.cDate.split('/').reverse().join('-')); // Convert 'MM/DD/YYYY' to 'YYYY-MM-DD'
      return dateB - dateA; // Sort in descending order
    });
    

    // Process data to ensure each date has entries for both sources
    const processedData = [];
    const dateMap = new Map();

    mergedData.forEach(item => {
      const dateKey = item.cDate; // Format date as YYYY-MM-DD
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { purchase: null, payment_made: null });
      }

      if (item.source === 'purchase') {
        dateMap.get(dateKey).purchase = item;
      } else if (item.source === 'payment_made') {
        dateMap.get(dateKey).payment_made = item;
      }
      
    console.log(dateKey);
    });


    

    // Convert map to array and add blank rows where needed
    dateMap.forEach((value, key) => {
      const purchaseEntry = value.purchase || {
        source: 'purchase',
        name: null,
        agent_name_sell: null,
        weight: null,
        rate: null,
        v_name: null,
        driver_name: null,
        receipt: null,
        amount: null,
        payment_mode: null,
        transaction_id: null,
        payment_date: null,
        cDate: key
      };

      const paymentMadeEntry = value.payment_made || {
        source: 'payment_made',
        name: null,
        agent_name_sell: null,
        weight: null,
        rate: null,
        v_name: null,
        driver_name: null,
        receipt: null,
        amount: null,
        payment_mode: null,
        transaction_id: null,
        payment_date: null,
        cDate: key
      };

      processedData.push(purchaseEntry, paymentMadeEntry);
    });

    // If data is found
    if (processedData.length > 0) {
      return res.status(200).send({
        error: false,
        message: 'Data fetched successfully',
        mergedData: processedData
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found for the given farmer',
        mergedData: []
      });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({
      message: 'Internal server error',
      error: true
    });
  }
};

const fetchpurchaseTransportCostAll = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM transportcost_purchase',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', PurchaseTransportCost: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', PurchaseTransportCost: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const adddailyWages = async (req, res) => {
  try {
    const { no_or_labour,wage_rate,total_amount,payment_made,payment_mode } = req.body;

      const result = await sequelize.query(
        'INSERT INTO dailey_wages (no_or_labour,wage_rate,total_amount,payment_made,payment_mode) VALUES (?,?,?,?,?)',
        {
          replacements: [no_or_labour,wage_rate,total_amount,payment_made,payment_mode],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};


const AddRevenue = async (req, res) => {
  try {
    const { shopId,Online,Offline,closing_date } = req.body;

    const existingClosing = await sequelize.query(
      'SELECT * FROM revenue WHERE shop_name = ? AND date = ?',
      {
        replacements: [shopId,closing_date],
        type: QueryTypes.SELECT
      }
    );

    if (existingClosing.length === 0) {

      const result = await sequelize.query(
        'INSERT INTO revenue (shop_name,online,offline,date) VALUES (?,?,?,?)',
        {
          replacements: [shopId,Online,Offline,closing_date],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
    }else{
      res.status(200).json({ error: v, message: 'Added Unsuccessfully!!!'});
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};

const UpdateRevenue = async (req, res) => {
  try {
    const { revenueId,Online,Offline } = req.body;

    const result = await sequelize.query(
      'UPDATE revenue SET online = ?,offline = ? WHERE id = ?',
      {
        replacements: [Online,Offline,revenueId],
        type: QueryTypes.UPDATE
      }
    );

    res.status(200).json({ error: false, message: 'Update successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not updated!!!' });
  }
};

const fetchdailyWages = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM dailey_wages',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', DailyWages: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', DailyWages: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const addDeisleCost = async (req, res) => {
  try {
    const { v_number,d_name,d_amount,bill,payment_mode } = req.body;

      const imagePath = saveBase64File(bill, 'uploads');

      const result = await sequelize.query(
        'INSERT INTO diesel_cost (v_number,d_name,d_amount,bill,payment_mode) VALUES (?,?,?,?,?)',
        {
          replacements: [v_number,d_name,d_amount,imagePath,payment_mode],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Added successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not added!!!' });
  }
};

const fetchDeisleCost = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM diesel_cost',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', DieselCost: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', DieselCost: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const fetchPaymentHistory = async (req, res) => {
  const { userId } = req.body; // Get userId from request parameters

  console.log('UserID:', userId); // Debug: Log userId to confirm it's being passed

  if (!userId) {
    return res.status(400).send({
      error: true,
      message: 'User ID is required',
    });
  }

  try {
    // Fetch data from the 'orders' table
    const ordersData = await sequelize.query(`
      SELECT 
        'order' AS source, 
        o.id AS OID, 
        o.tPrice AS AMOUNT, 
        DATE_FORMAT(o.created_at, '%Y-%m-%d %H:%i:%s') AS cDateTime,
        c.quantity AS quantity,               
        p.p_name AS product_name              
      FROM orders o
      JOIN cart c ON o.id = c.order_id       
      JOIN product p ON c.product_id = p.id   
      WHERE o.user_id = ?                     
      ORDER BY o.created_at DESC
    `, { 
      replacements: [userId], 
      type: QueryTypes.SELECT 
    });
    

    // Fetch data from the 'paymentdone' table
    const paymentdoneData = await sequelize.query(`
      SELECT 
        'paid' AS source, 
        id AS OID, 
        amount AS AMOUNT, 
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS cDateTime
      FROM paymentdone 
      WHERE user_id = ?
      ORDER BY created_at DESC
    `, { 
      replacements: [userId], 
      type: QueryTypes.SELECT 
    });

    // Merge both datasets and sort them by cDateTime
    const mergedData = [...ordersData, ...paymentdoneData].sort((a, b) => {
      const dateTimeA = new Date(a.cDateTime);
      const dateTimeB = new Date(b.cDateTime);
      return dateTimeB - dateTimeA; // Sort in descending order
    });

    // Return data if found
    if (mergedData.length > 0) {
      return res.status(200).send({
        error: false,
        message: 'Data fetched successfully',
        PaymentHistory: mergedData,
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found for the given user',
        PaymentHistory: [],
      });
    }

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({
      message: 'Internal server error',
      error: true,
    });
  }
};


const fetchTotalAmount = async (req, res) => {
  const { userId } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const UserOrderResult = await sequelize.query(
      `SELECT SUM(tPrice) as OAMT FROM orders 
       WHERE user_id = ? AND status = ?`,
      {
        replacements: [userId,'2'],
        type: QueryTypes.SELECT
      }
    );

    const paymentDoneResult = await sequelize.query(
      `SELECT SUM(amount) as PDAMT FROM paymentdone 
       WHERE user_id = ? 
       AND status = ?`,
      {
        replacements: [userId, '0'],
        type: QueryTypes.SELECT
      }
    );

    const paymentPendingResult = await sequelize.query(
      `SELECT SUM(amount) as PPAMT FROM paymentdone 
       WHERE user_id = ? 
       AND status = ?`,
      {
        replacements: [userId, '1'],
        type: QueryTypes.SELECT
      }
    );

    var orderAMount = 0;
    var paymentDoneAMount = 0;
    var paymentPendingAMount = 0;

    if(UserOrderResult[0].OAMT != null){
      orderAMount = UserOrderResult[0].OAMT;
    }

    if(paymentDoneResult[0].PDAMT != null){
      paymentDoneAMount = paymentDoneResult[0].PDAMT;
    }

    if(paymentPendingResult[0].PPAMT != null){
      paymentPendingAMount = paymentPendingResult[0].PPAMT;
    }

    var totalAddAmount = orderAMount + paymentPendingAMount;
    var totalAmount = totalAddAmount - paymentDoneAMount;

    res.status(200).json({ message: 'Amount Fetch', error: false, totalAmount:  totalAmount});

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};

const createPayment = async (req, res) => {
  const { userId, price } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const result = await sequelize.query(
      'INSERT INTO paymentdone (user_id, amount,status) VALUES (?,?,?)',
      { replacements: [userId, price,'0'], type: QueryTypes.INSERT }
    );

    res.status(200).json({ message: 'payment done!', error: false });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};


const fetchordersforadmin = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT orders.*,register.name as NAME,register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id ORDER BY orders.created_at DESC',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){

      for (const order of productList) {
        const cartItems = await sequelize.query('SELECT cart.*,product.p_name as PNAME,product.p_image as PIMAGE,product.p_price as PPRICE FROM cart INNER JOIN product ON cart.product_id = product.id WHERE cart.order_id = ?', 
          { 
            replacements: [order.id], 
            type: QueryTypes.SELECT 
          });

          order.cartItems = cartItems;
      }
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', Orders: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', Orders: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};
const fetchAdminPayments = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT paymentdone.*,register.name as NAME,register.oNumber as ONUMBER,register.eNumber as ENUMBER FROM paymentdone INNER JOIN register ON paymentdone.user_id = register.id ORDER BY paymentdone.created_at DESC',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data fetch Successfully', Payments: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', Payments: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const fetchAllUsers = async (req, res) => {
  try {
    const productList = await sequelize.query(
      'SELECT * FROM register ORDER BY id DESC',
      { type: QueryTypes.SELECT }
    );

    // Loop over each user in productList to fetch orders and payments
    for (const user of productList) {
      // Fetch orders for the given user_id
      const orderList = await sequelize.query(
        'SELECT orders.*, register.name as NAME, register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id WHERE orders.user_id = ? ORDER BY orders.created_at DESC',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      // Calculate total order amount by summing `tPrice` as a number for this user
      user.orderTotalAmount = orderList.reduce((total, order) => total + Number(order.tPrice || 0), 0);

      // Fetch payments for the given user_id
      const paymentList = await sequelize.query(
        'SELECT paymentdone.*, register.name as NAME, register.oNumber as ONUMBER, register.eNumber as ENUMBER FROM paymentdone INNER JOIN register ON paymentdone.user_id = register.id WHERE paymentdone.user_id = ? ORDER BY paymentdone.created_at DESC',
        {
          replacements: [user.id],
          type: QueryTypes.SELECT
        }
      );

      // Calculate total payment amount by summing `amount` as a number for this user
      user.paymentTotal = paymentList.reduce((total, payment) => total + Number(payment.amount || 0), 0);

      // Calculate the difference between orderTotalAmount and paymentTotal
      user.pendingAmount = user.orderTotalAmount - user.paymentTotal;
    }

    if (productList.length > 0) {
      return res.status(200).send({
        error: false,
        message: 'Data fetched successfully',
        Users: productList
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found',
        Users: []
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Internal server error',
      error: true
    });
  }
};




const fetchOrdersAndPaymentsForAdmin = async (req, res) => {
  try {
    const { userId } = req.body;

    // Fetch orders for the given user_id
    const orderList = await sequelize.query(
      'SELECT orders.*, register.name as NAME, register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id WHERE orders.user_id = ? ORDER BY orders.created_at DESC',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    // Calculate total order amount by summing `tPrice` as a number
    const orderTotalAmount = orderList.reduce((total, order) => total + Number(order.tPrice || 0), 0);

    // If orders are found, fetch the corresponding cart items for each order
    if (orderList.length > 0) {
      for (const order of orderList) {
        const cartItems = await sequelize.query(
          'SELECT cart.*, product.p_name as PNAME, product.p_image as PIMAGE, product.p_price as PPRICE FROM cart INNER JOIN product ON cart.product_id = product.id WHERE cart.order_id = ?',
          {
            replacements: [order.id],
            type: QueryTypes.SELECT
          }
        );
        order.cartItems = cartItems;
      }
    }

    // Fetch payments for the given user_id
    const paymentList = await sequelize.query(
      'SELECT paymentdone.*, register.name as NAME, register.oNumber as ONUMBER, register.eNumber as ENUMBER FROM paymentdone INNER JOIN register ON paymentdone.user_id = register.id WHERE paymentdone.user_id = ? ORDER BY paymentdone.created_at DESC',
      {
        replacements: [userId],
        type: QueryTypes.SELECT
      }
    );

    // Calculate total payment amount by summing `amount` as a number
    const paymentTotal = paymentList.reduce((total, payment) => total + Number(payment.amount || 0), 0);

    // If neither orders nor payments are found, return 404
    if (orderList.length === 0 && paymentList.length === 0) {
      return res.status(404).send({
        error: true,
        message: 'Data not found for the given user',
        Data: []
      });
    }

    // Combine orders and payments with respective type
    const combinedData = [
      ...orderList.map(order => ({ ...order, type: 'O' })),
      ...paymentList.map(payment => ({ ...payment, type: 'P' }))
    ];

    // Sort combined data by created_at in descending order
    combinedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Send the combined response with total amounts
    return res.status(200).send({
      error: false,
      message: 'Data fetched successfully',
      Data: combinedData,
      orderTotalAmount,
      paymentTotal
    });

  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send({
      message: 'Error fetching data',
      error: true
    });
  }
};






const fetchorderdetails = async (req, res) => {
  try {

    const { orderId } = req.body;

    const productList = await sequelize.query('SELECT orders.*,register.name as NAME,register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id WHERE orders.id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT }); 

    if(productList.length > 0){

      const cartItems = await sequelize.query('SELECT cart.*,product.p_name as PNAME,product.p_image as PIMAGE,product.p_price as PPRICE FROM cart INNER JOIN product ON cart.product_id = product.id WHERE cart.order_id = ?', 
      { 
        replacements: [orderId], 
        type: QueryTypes.SELECT 
      });
  
      // Combine order details with cart items
      const orderWithCartItems = {
        ...productList[0],  // Assuming there's only one order
        cartItems: cartItems // Array of cart items
      };

      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', OrderDetails: orderWithCartItems });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', OrderDetails: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


const updateUserCart = async (req, res) => {
  try {
    const { cart_id,order_id,product_id,quntity,amount } = req.body;

      const result = await sequelize.query(
        'UPDATE cart SET product_id = ?,quantity = ?,price = ? WHERE id = ?',
        {
          replacements: [product_id,quntity,amount,cart_id],
          type: QueryTypes.UPDATE
        }
      );

      var totalPrice = 0;

      // if(result[0] != null){
        const orderList = await sequelize.query('SELECT SUM(price) as TPRICE FROM cart WHERE order_id = ?',
          { replacements: [order_id], type: QueryTypes.SELECT }); 

          totalPrice = orderList[0].TPRICE;

          const orderresult = await sequelize.query(
            'UPDATE orders SET tPrice = ? WHERE id = ?',
            {
              replacements: [totalPrice,order_id],
              type: QueryTypes.UPDATE
            }
          );
    
          // if(orderresult[0] != null){
            res.status(200).json({ error: false, message: 'Updated successfully!!!'});
          // }
      // }

  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not updated!!!' });
  }
};



const fetchAllUsersbyType = async (req, res) => {
  try {
    const { type } = req.body;
    const productList = await sequelize.query('SELECT * FROM register WHERE type = ? ORDER BY id DESC',
      { replacements: [type], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', Users: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', Users: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


const UpdateView = async (req, res) => {
  const { userId ,sellPriceStatus } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const result = await sequelize.query(
      'UPDATE register SET sellPriceStatus = ? WHERE id = ?',
      { replacements: [sellPriceStatus, userId], type: QueryTypes.UPDATE }
    );

    res.status(200).json({ message: 'Update done!', error: false });

  } catch (error) {
    console.error('Error processing Update:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};

const placeOrderByadmin = async (req, res) => {
  try {
    const {  product_id, user_id, quantity, price} = req.body;

    const [existingUserCart] = await sequelize.query('SELECT * FROM cart WHERE product_id = ? AND user_id = ? AND status = ?',
      { replacements: [product_id,user_id, 0], type: QueryTypes.SELECT });


    if (!existingUserCart) {
      const result = await sequelize.query(
        'INSERT INTO cart (product_id, user_id,quantity,price) VALUES (?,?,?,?)',
        {
          replacements: [product_id, user_id,quantity,price],
          type: QueryTypes.INSERT
        }
      );
  
      if (result && result[0] != null) {

        const resultOrder = await sequelize.query(
          'INSERT INTO orders (user_id, tPrice) VALUES (?, ?)',
          { replacements: [user_id, price], type: QueryTypes.INSERT }
        );

        if (resultOrder && resultOrder[0] != null) {
          const insertedId = resultOrder[0];
          const resultUpdate = await sequelize.query(
            'UPDATE cart SET status = 1, order_id = ? WHERE user_id = ? AND status = 0',
            { replacements: [insertedId, user_id], type: QueryTypes.UPDATE }
          );
          res.status(200).json({ message: 'Order created', error: false });
        } else {
          res.status(400).json({ message: 'Order not created', error: true });
        }
      } else {
        res.status(400).json({ message: 'Order not created', error: true });
      }
    } else {
      return res.status(404).send({ error: true, message: 'Product already exist in cart!' });
    }
  } catch (error) {
    console.error('Error creating Category:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};

const fetchInventory = async (req, res) => {
  try {
    const productList = await sequelize.query(
      'SELECT inventory.*, category.cat_name, product.p_name FROM inventory INNER JOIN category ON inventory.category_id = category.id INNER JOIN product ON inventory.product_id = product.id ORDER BY inventory.created_at DESC',
      { replacements: [], type: QueryTypes.SELECT }
    );

    if (productList.length > 0) {
      // Group the inventory items by date with custom keys and sum total_amount per date
      const inventoryByDate = productList.reduce((acc, item) => {
        const date = item.created_at.toISOString().split('T')[0]; // format date as YYYY-MM-DD
        const totalAmount = parseInt(item.total_amount, 10) || 0; // Convert total_amount to an integer
        
        const existingDateGroup = acc.find(group => group.addDate === date);

        if (existingDateGroup) {
          existingDateGroup.inventory.push(item);
          // Add the total_amount to the existing sum for this date
          existingDateGroup.totalSum += totalAmount;
        } else {
          acc.push({
            addDate: date,
            inventory: [item],
            totalSum: totalAmount // Initialize total sum for this date
          });
        }

        return acc;
      }, []);

      // Convert the totalSum back to string for each date group
      inventoryByDate.forEach(group => {
        group.totalSum = group.totalSum.toString();
      });

      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        AllInventory: inventoryByDate 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        AllInventory: [] 
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};




const createInventory = async (req, res) => {
  const { category_id, product_id,quantity,base_price,total_amount } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const result = await sequelize.query(
      'INSERT INTO inventory (category_id, product_id,quantity,base_price,total_amount) VALUES (?,?,?,?,?)',
      { replacements: [category_id, product_id,quantity,base_price,total_amount], type: QueryTypes.INSERT }
    );

    res.status(200).json({ message: 'inventory added!', error: false });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
}; 


const fetchProductAdminById = async (req, res) => {
  try {

    const { cId } = req.body;

    const productList = await sequelize.query('SELECT product.*,category.id as CID,category.cat_name as CNAME FROM product INNER JOIN category ON product.category_id = category.id WHERE product.category_id = ?',
      { replacements: [cId], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', Product: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', Product: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const deliverOrder = async (req, res) => {
  const { oId } = req.body;

  try {
    // Get yesterday's date in YYYY-MM-DD format
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

    // Step 1: Fetch the order details from the cart table based on the order id
    const cartResult = await sequelize.query(
      `SELECT cart.product_id, cart.quantity
       FROM cart
       WHERE cart.order_id = ?`,
      { replacements: [oId], type: QueryTypes.SELECT }
    );

    if (cartResult.length === 0) {
      return res.status(404).json({ message: 'Order not found in cart', error: true });
    }

    const { product_id, quantity: cartQuantity } = cartResult[0];

    // Step 2: Check if the product is available in the inventory and the quantity is sufficient
    const inventoryResult = await sequelize.query(
      `SELECT inventory.quantity,inventory.base_price, inventory.created_at
       FROM inventory
       WHERE inventory.product_id = ? AND DATE(inventory.created_at) = ?`,
      { replacements: [product_id, yesterdayDate], type: QueryTypes.SELECT }
    );

    if (inventoryResult.length === 0) {
      await sequelize.query(
        'UPDATE orders SET status = ? WHERE id = ?',
        { replacements: ['2', oId], type: QueryTypes.UPDATE }
      );
  
      res.status(200).json({ message: 'Order delivered and inventory updated!', error: false });
    } else {
      let availableInventory = inventoryResult[0].quantity;
      var totalPrice = 0;
      if (availableInventory <= 0) {
        await sequelize.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          { replacements: ['2', oId], type: QueryTypes.UPDATE }
        );
    
        res.status(200).json({ message: 'Order delivered and inventory updated!', error: false });
      } else {
        let newInventoryQuantity;
        if (availableInventory < cartQuantity) {
          newInventoryQuantity = 0;
          totalPrice = 0; // Set inventory to 0 if it's less than the cart quantity
        } else {
          newInventoryQuantity = availableInventory - cartQuantity;
          totalPrice = newInventoryQuantity * inventoryResult[0].base_price;
        }
    
        // Step 5: Update the inventory with the new quantity
        await sequelize.query(
          `UPDATE inventory
           SET quantity = ?,total_amount=?
           WHERE product_id = ? AND DATE(created_at) = ?`,
          { replacements: [newInventoryQuantity, totalPrice,product_id, yesterdayDate], type: QueryTypes.UPDATE }
        );
    
        // Step 6: Update the order status to 'delivered' (status = '2')
        await sequelize.query(
          'UPDATE orders SET status = ?,created_at = ? WHERE id = ?',
          { replacements: ['2', inventoryResult[0].created_at,oId], type: QueryTypes.UPDATE }
        );
    
        res.status(200).json({ message: 'Order delivered and inventory updated!', error: false });
    
      }
  
    }

    

    // Step 3: Check if inventory quantity is sufficient, and update accordingly
    
    // Step 4: Subtract the quantity from inventory but ensure no negative values
    
  } catch (error) {
    console.error('Error processing Update:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
};





const fetchExpences = async (req, res) => {
  try {
    const productList = await sequelize.query(
      'SELECT * from otherexpenses order by created_at DESC',
      { replacements: [], type: QueryTypes.SELECT }
    );

    if (productList.length > 0) {
      // Group the inventory items by date with custom keys and sum total_amount per date
      

      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        AllExpences: productList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        AllExpences: [] 
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const createExpences = async (req, res) => {
  const { quantity,total_amount } = req.body;

  try {
    // Fetch orders created in the last hour with status '1'
    const result = await sequelize.query(
      'INSERT INTO otherexpenses (name,amount) VALUES (?,?)',
      { replacements: [quantity,total_amount], type: QueryTypes.INSERT }
    );

    res.status(200).json({ message: 'Expenses added!', error: false });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error', error: true });
  }
}; 

const fetchAdminHomeData = async (req, res) => {
  try {
    const orderResult = await sequelize.query(
      `SELECT SUM(orders.tPrice) as OAMOUNT, DATE(orders.created_at) as ODATE 
      FROM orders 
      WHERE orders.status = ? 
      GROUP BY DATE(orders.created_at) 
      ORDER BY ODATE DESC`,
      { replacements: ['2'], type: QueryTypes.SELECT }
    );

    const purchaseCaneResult = await sequelize.query(
      `SELECT SUM(sell_sugarcane.amount) as PURCHASEAMOUNT, DATE(sell_sugarcane.created_at) as PDATE 
      FROM sell_sugarcane
      GROUP BY DATE(sell_sugarcane.created_at) 
      ORDER BY PDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    const dieselCostResult = await sequelize.query(
      `SELECT SUM(diesel_cost.d_amount) as DIESELCOST, DATE(diesel_cost.created_at) as DCDATE 
      FROM diesel_cost
      GROUP BY DATE(diesel_cost.created_at) 
      ORDER BY DCDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    const wagesCostResult = await sequelize.query(
      `SELECT SUM(dailey_wages.total_amount) as WAGESCOST, DATE(dailey_wages.created_at) as WCDATE 
      FROM dailey_wages
      GROUP BY DATE(dailey_wages.created_at) 
      ORDER BY WCDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    const transportCostResult = await sequelize.query(
      `SELECT SUM(transportcost_sell.amount) as TRANSPORTCOST, DATE(transportcost_sell.created_at) as TCDATE 
      FROM transportcost_sell
      GROUP BY DATE(transportcost_sell.created_at) 
      ORDER BY TCDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    const inventoryResult = await sequelize.query(
      `SELECT SUM(inventory.total_amount) as INVENTORTYAMOUNT, DATE(inventory.created_at) as IDATE 
      FROM inventory
      GROUP BY DATE(inventory.created_at) 
      ORDER BY IDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    const otherexpenseResult = await sequelize.query(
      `SELECT SUM(otherexpenses.amount) as OTHEREXPENSEAMOUNT, DATE(otherexpenses.created_at) as OEDATE 
      FROM otherexpenses
      GROUP BY DATE(otherexpenses.created_at) 
      ORDER BY OEDATE DESC`,
      { replacements: [], type: QueryTypes.SELECT }
    );

    // Collect all unique dates from each dataset
    const allDates = new Set([
      ...orderResult.map(item => item.ODATE),
      ...purchaseCaneResult.map(item => item.PDATE),
      ...dieselCostResult.map(item => item.DCDATE),
      ...wagesCostResult.map(item => item.WCDATE),
      ...transportCostResult.map(item => item.TCDATE),
      ...inventoryResult.map(item => item.IDATE),
      ...otherexpenseResult.map(item => item.OEDATE)
    ]);

    // Create a single array merging all data
    const mergedData = Array.from(allDates).map(date => {
      const order = orderResult.find(item => item.ODATE === date) || { OAMOUNT: 0 };
      const purchase = purchaseCaneResult.find(item => item.PDATE === date) || { PURCHASEAMOUNT: 0 };
      const diesel = dieselCostResult.find(item => item.DCDATE === date) || { DIESELCOST: 0 };
      const wages = wagesCostResult.find(item => item.WCDATE === date) || { WAGESCOST: 0 };
      const transport = transportCostResult.find(item => item.TCDATE === date) || { TRANSPORTCOST: 0 };
      const inventory = inventoryResult.find(item => item.IDATE === date) || { INVENTORTYAMOUNT: 0 };
      const otherexpense = otherexpenseResult.find(item => item.OEDATE === date) || { OTHEREXPENSEAMOUNT: 0 };

      return {
        date,
        OAMOUNT: order.OAMOUNT,
        PURCHASEAMOUNT: purchase.PURCHASEAMOUNT,
        DIESELCOST: diesel.DIESELCOST,
        WAGESCOST: wages.WAGESCOST,
        TRANSPORTCOST: transport.TRANSPORTCOST,
        INVENTORTYAMOUNT: inventory.INVENTORTYAMOUNT,
        OTHEREXPENSEAMOUNT: otherexpense.OTHEREXPENSEAMOUNT
      };
    });

    // Send the merged data in the response
    return res.status(200).send({
      error: false,
      message: 'Data fetched successfully',
      overallData: mergedData
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true,
      overallData: []
    });
  }
};

const fetchUserPaymentHistory = async (req, res) => {

  const { userId } = req.body;

  try {
    const paymentHistoryList = await sequelize.query(
      'SELECT * from paymentdone WHERE user_id = ? order by created_at DESC',
      { replacements: [userId], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserPaymentHistory: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserPaymentHistory: [] 
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

//btoc apis
const shopregister = async (req, res) => {
  try {
    const { shop_name,owner_name, owner_mobile,gst_no,address,salary,rent } = req.body;

    const existingMobile = await sequelize.query(
      'SELECT * FROM shops WHERE owner_mobile = ?',
      {
        replacements: [owner_mobile],
        type: QueryTypes.SELECT
      }
    );

    const existingUsername = await sequelize.query(
      'SELECT * FROM shops WHERE gst_no = ?',
      {
        replacements: [gst_no],
        type: QueryTypes.SELECT
      }
    );

    if (existingMobile.length === 0 && existingUsername.length === 0) {
      
      const result = await sequelize.query(
        'INSERT INTO shops (shop_name,owner_name, owner_mobile,gst_no,address,salary,rent) VALUES (?, ?, ?, ?,?,?,?)',
        {
          replacements: [shop_name,owner_name, owner_mobile,gst_no,address,salary,rent],
          type: QueryTypes.INSERT
        }
      );

      const userId = result[0];

      // Generate and send OTP
      // await sendOTP(mobileNumber);
      res.status(200).json({ error: false, message: 'Shop registered successfully', userId: userId });
    } else {
      res.status(400).json({ error: true, message: 'Shop Owner mobile or GST number already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Shop not added!!!' });
  }
};

const updateShop = async (req, res) => {
  try {
    const { shop_id,shop_name,owner_name, owner_mobile,gst_no,address } = req.body;

    const existingMobile = await sequelize.query(
      'SELECT * FROM shops WHERE owner_mobile = ? AND id != ?',
      {
        replacements: [owner_mobile,shop_id],
        type: QueryTypes.SELECT
      }
    );

    const existingUsername = await sequelize.query(
      'SELECT * FROM shops WHERE gst_no = ? AND id != ?',
      {
        replacements: [gst_no,shop_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingMobile.length === 0 && existingUsername.length === 0) {
      
      const result = await sequelize.query(
        'UPDATE shops SET shop_name = ?,owner_name = ?, owner_mobile = ?,gst_no = ?,address = ? WHERE id = ?',
        {
          replacements: [shop_name,owner_name, owner_mobile,gst_no,address,shop_id],
          type: QueryTypes.UPDATE
        }
      );
      res.status(200).json({ error: false, message: 'Shop updated successfully'});
    } else {
      res.status(400).json({ error: true, message: 'Shop Owner mobile or GST number already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Shop not updated!!!' });
  }
};

const fetchShops = async (req, res) => {
  try {

    const paymentHistoryList = await sequelize.query(
      'SELECT * from shops order by created_at DESC',
      { replacements: [], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        AllShops: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        AllShops: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true
    });
  }
};

const fetchAllRevenueDetails = async (req, res) => {
  try {
    // Query to fetch all data from revenue table and join with shops table
    const revenueDetails = await sequelize.query(`
      SELECT revenue.*, shops.shop_name, shops.owner_mobile
      FROM revenue
      JOIN shops ON revenue.shop_name = shops.id
    `, {
      type: QueryTypes.SELECT
    });

    if (revenueDetails.length > 0) {
      return res.status(200).send({ error: false, message: 'Data Fetched', RevenueDetails: revenueDetails });
    } else {
      return res.status(404).send({ error: true, message: 'No data found' });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in fetching all revenue details!',
      error: true,
    });
  }
};


const fetchShopdetails = async (req, res) => {
  try {
    const { shopid } = req.body;

    const [existingUser] = await sequelize.query('SELECT * FROM shops WHERE id = ?',
      { replacements: [shopid], type: QueryTypes.SELECT });
    if (existingUser) {
      return res.status(200).send({ error: false, message: 'Data Fetch', ShopDetails: existingUser });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found' });
    }

    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true,
    });
  }
};

const createAttendance = async (req, res) => {
  try {
    const { userid,a_date, a_time,a_image,type } = req.body;

    // const existingDate = await sequelize.query(
    //   'SELECT * FROM attendance WHERE a_date = ?',
    //   {
    //     replacements: [a_date],
    //     type: QueryTypes.SELECT
    //   }
    // );

    const existingType = await sequelize.query(
      'SELECT * FROM attendance WHERE a_date = ? AND type = ?',
      {
        replacements: [a_date,type],
        type: QueryTypes.SELECT
      }
    );

    // console.log(existingDate.length);
    console.log(existingType.length);

    if (existingType.length === 0) {
      const imagePath = saveBase64File(a_image, 'uploads');

      const result = await sequelize.query(
        'INSERT INTO attendance (userid,a_date, a_time,a_image,type) VALUES (?, ?, ?, ?,?)',
        {
          replacements: [userid,a_date, a_time,imagePath,type],
          type: QueryTypes.INSERT
        }
      );
      res.status(200).json({ error: false, message: 'Attendace added successfully' });
    } else {
      res.status(400).json({ error: true, message: 'Attendance already marked!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Attendance not added!!!' });
  }
};

const fetchattendancbyuser = async (req, res) => {
  try {
    const { userid} = req.body;

    const paymentHistoryList = await sequelize.query(
      'SELECT * from attendance WHERE userid = ? order by created_at DESC',
      { replacements: [userid], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserAttendance: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserAttendance: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true
    });
  }
};

const fetchattendancuserbyDate = async (req, res) => {
  try {
    const { userid,a_date} = req.body;

    const paymentHistoryList = await sequelize.query(
      'SELECT * from attendance WHERE userid = ? AND a_date = ? order by created_at DESC',
      { replacements: [userid,a_date], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserAttendance: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserAttendance: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true
    });
  }
};

const createLeaves = async (req, res) => {
  try {
    const { userid,l_date,type } = req.body;
    const [day, month, year] = l_date.split('-');

    const totalLeavesForMonth = await sequelize.query(
      `SELECT COUNT(*) AS total FROM leaves 
       WHERE MONTH(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? 
       AND YEAR(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? 
       AND type = ? AND userid = ?`,
      {
        replacements: [month, year, type,userid],
        type: QueryTypes.SELECT
      }
    );

    if (totalLeavesForMonth[0].total < 2 && type == "Casual") {

      const result = await sequelize.query(
        'INSERT INTO leaves (userid,l_date,type) VALUES (?, ?, ?)',
        {
          replacements: [userid,l_date,type],
          type: QueryTypes.INSERT
        }
      );
      res.status(200).json({ error: false, message: 'Leave added successfully' });
    } else if (totalLeavesForMonth[0].total < 1 && type == "Emergency") {
      const result = await sequelize.query(
        'INSERT INTO leaves (userid,l_date,type) VALUES (?, ?,?)',
        {
          replacements: [userid,l_date,type],
          type: QueryTypes.INSERT
        }
      );
      res.status(200).json({ error: false, message: 'Leave added successfully' });
    } else {
      res.status(400).json({ error: true, message: 'You have not any Leave remains!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Leave not added!!!' });
  }
};

const fetchleavebyuser = async (req, res) => {
  try {
    const { userid} = req.body;

    const paymentHistoryList = await sequelize.query(
      'SELECT * from leaves WHERE userid = ? order by created_at DESC',
      { replacements: [userid], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserLeave: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserLeave: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true
    });
  }
};

const fetchleaveuserbyDate = async (req, res) => {
  try {
    const { userid,l_date} = req.body;
    const [day, month, year] = l_date.split('-');
    // const totalLeavesForMonth = await sequelize.query(
    //   `SELECT COUNT(*) AS total FROM leaves 
    //    WHERE MONTH(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? 
    //    AND YEAR(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? 
    //    AND type = ?`,
    //   {
    //     replacements: [month, year, type],
    //     type: QueryTypes.SELECT
    //   }
    // );
    const paymentHistoryList = await sequelize.query(
      "SELECT * from leaves WHERE userid = ? AND MONTH(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? AND YEAR(STR_TO_DATE(l_date, '%d-%m-%Y')) = ? order by created_at DESC",
      { replacements: [userid,month,year], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserLeave: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserLeave: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const createBtoCExpense = async (req, res) => {
  try {
    const { userid,shop_id,reason,amount,add_date } = req.body;

    const result = await sequelize.query(
      'INSERT INTO btoc_expense (userid,shop_id,reason,amount,add_date) VALUES (?, ?, ?, ?, ?)',
      {
        replacements: [userid,shop_id,reason,amount,add_date],
        type: QueryTypes.INSERT
      }
    );
    res.status(200).json({ error: false, message: 'Expense added successfully' });
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Expense not added!!!' });
  }
};

const fetchExpensebyuser = async (req, res) => {
  try {
    const { userid} = req.body;

    const paymentHistoryList = await sequelize.query(
      'SELECT * from btoc_expense WHERE userid = ? order by created_at DESC',
      { replacements: [userid], type: QueryTypes.SELECT }
    );

    if (paymentHistoryList.length > 0) {
      
      return res.status(200).send({ 
        error: false, 
        message: 'Data Fetched Successfully', 
        UserExpense: paymentHistoryList 
      });
    } else {
      return res.status(404).send({ 
        error: true, 
        message: 'Data not found', 
        UserExpense: [] 
      });
    }
    
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Error in login check api!',
      error: true
    });
  }
};

const addShopProduct = async (req, res) => {
  try {
    const { p_name,p_image,p_desc } = req.body;

    const existingProduct = await sequelize.query(
      'SELECT * FROM shop_product WHERE LOWER(p_name) = LOWER(?)',
      {
        replacements: [p_name],
        type: QueryTypes.SELECT
      }
    );

    if (existingProduct.length === 0) {
      const imagePath = saveBase64File(p_image, 'uploads');

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'INSERT INTO shop_product (p_name,p_image,p_desc) VALUES (?,?,?)',
        {
          replacements: [p_name,imagePath,p_desc],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Product added successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Product already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not added!!!' });
  }
};

const updateShopProduct = async (req, res) => {
  try {
    const { pid,p_name,p_image,p_desc } = req.body;

    const existingCategory = await sequelize.query(
      'SELECT * FROM shop_product WHERE id != ? AND LOWER(p_name) = LOWER(?)',
      {
        replacements: [pid,p_name],
        type: QueryTypes.SELECT
      }
    );

    if (existingCategory.length === 0) {

      const categoryDetails = await sequelize.query(
        'SELECT * FROM shop_product WHERE id = ?',
        {
          replacements: [pid],
          type: QueryTypes.SELECT
        }
      );

      var imagePath = "";

      if(p_image != ""){
        imagePath = saveBase64File(p_image, 'uploads');
      } else {
        imagePath = categoryDetails[0].p_image;
      }
      

      // Insert new jobseeker into the database
      const result = await sequelize.query(
        'UPDATE shop_product SET p_name = ?, p_image  = ?, p_desc = ? WHERE id = ?',
        {
          replacements: [p_name,imagePath,p_desc,pid],
          type: QueryTypes.UPDATE
        }
      );

      res.status(200).json({ error: false, message: 'Product update successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Product already exist!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not updated!!!' });
  }
};

const assignUsertoShop = async (req, res) => {
  try {
    const { shop_id,user_id} = req.body;

    const result = await sequelize.query(
      'UPDATE register SET shop_id = ? WHERE id = ?',
      {
        replacements: [shop_id,user_id],
        type: QueryTypes.UPDATE
      }
    );

    res.status(200).json({ error: false, message: 'User assign successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'User not assign!!!' });
  }
};

const fetchAllAssignUser = async (req, res) => {
  try {
    const { shop_id} = req.body;
    const productList = await sequelize.query('SELECT * FROM register WHERE shop_id = ? ORDER BY id DESC',
      { replacements: [shop_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'User Fetch Successfully', Users: productList });
    } else {
      return res.status(404).send({ error: true, message: 'User not found', Users: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'User not found',
      error: true
    });
  }
};

const fetchAllShopProduct = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM shop_product ORDER BY id DESC',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', ShopProduct: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', ShopProduct: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const assignProducttoShop = async (req, res) => {
  try {
    const { p_id,s_id,quantity,amount } = req.body;

    const existingProduct = await sequelize.query(
      'SELECT * FROM assign_shop_product WHERE p_id = ? AND s_id = ?',
      {
        replacements: [p_id,s_id],
        type: QueryTypes.SELECT
      }
    );

    if (existingProduct.length === 0) {
      const result = await sequelize.query(
        'INSERT INTO assign_shop_product (p_id,s_id,quantity,amount,product_quantity) VALUES (?,?,?,?,?)',
        {
          replacements: [p_id,s_id,quantity,amount,quantity],
          type: QueryTypes.INSERT
        }
      );

      const assignId = result[0];
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const year = date.getFullYear();

      const formattedDate = `${day}-${month}-${year}`;
      const resultadd = await sequelize.query(
        'INSERT INTO dayli_open_shop_quantity (ass_id,shop_id,open_quantity,amount,open_date) VALUES (?,?,?,?,?)',
        {
          replacements: [assignId,s_id,quantity,amount,formattedDate],
          type: QueryTypes.INSERT
        }
      );

      res.status(200).json({ error: false, message: 'Product assigned successfully!!!'});
    } else {
      res.status(400).json({ error: true, message: 'Product already assigned to this shop!!!' });
    }
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not assigned!!!' });
  }
};

const updateassignProducttoShop = async (req, res) => {
  try {
    const { assign_id,quantity,amount } = req.body;

    const result = await sequelize.query(
      'UPDATE assign_shop_product SET quantity = ?, amount = ?  WHERE id = ?',
      {
        replacements: [quantity,amount,assign_id],
        type: QueryTypes.UPDATE
      }
    );

    res.status(200).json({ error: false, message: 'Update successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Product not Updated!!!' });
  }
};

const fetchAllAssignShopProduct = async (req, res) => {
  try {

    const { shop_id,currunt_date } = req.body;

    const productList = await sequelize.query('SELECT assign_shop_product.*,shop_product.p_name as PNAME,shop_product.p_image as PIMAGE,shop_product.p_desc as PDESC FROM assign_shop_product INNER JOIN shop_product ON assign_shop_product.p_id =  shop_product.id WHERE assign_shop_product.s_id = ? ORDER BY assign_shop_product.id DESC',
      { replacements: [shop_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      for (let product of productList) {
        const assignId = product.id;

        const openQuantityData = await sequelize.query(
          `SELECT open_quantity,amount 
           FROM dayli_open_shop_quantity 
           WHERE ass_id = ? AND open_date = ?`,
          { replacements: [assignId, currunt_date], type: QueryTypes.SELECT }
        );

        // Add the open quantity data to each product entry
        const todayquntity = openQuantityData.length > 0 ? openQuantityData[0].open_quantity : 0;
        const todayamount = openQuantityData.length > 0 ? openQuantityData[0].amount : 0;

        const todayPurchase = todayquntity * todayamount;
        product.todaypurchase = todayPurchase;

        // Fetch the overall count for this product if needed
        const overallCountData = await sequelize.query(
          `SELECT SUM(open_quantity * amount) AS overall_purchase 
           FROM dayli_open_shop_quantity 
           WHERE ass_id = ?`,
          { replacements: [assignId], type: QueryTypes.SELECT }
        );

        product.overall_purchase = overallCountData.length > 0 ? overallCountData[0].overall_purchase : 0;
      }
      return res.status(200).send({ error: false, message: 'Product Fetch Successfully', AllShopProduct: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Product not found', AllShopProduct: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Product not found',
      error: true
    });
  }
};

const fetchbtocpurchase = async (req, res) => {
  try {

    const { ass_id} = req.body;

    const productList = await sequelize.query('SELECT * FROM dayli_open_shop_quantity WHERE ass_id = ? ORDER BY id DESC',
      { replacements: [ass_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', PurchaseData: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', PurchaseData: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const fetchbtocsell = async (req, res) => {
  try {

    const { ass_id} = req.body;

    const productList = await sequelize.query('SELECT * FROM daily_close_shop_quantity WHERE ass_id = ? ORDER BY id DESC',
      { replacements: [ass_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', SellData: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', SellData: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const fetchEmpDetails = async (req, res) => {
  try {

    const { user_id } = req.body;

    const productList = await sequelize.query('SELECT register.*,shops.shop_name as SNAME,shops.owner_name as SMOBILE,shops.owner_mobile as SOWNER,shops.address as SADD FROM register INNER JOIN shops ON register.shop_id =  shops.id WHERE register.id = ?',
      { replacements: [user_id], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', UserDetails: productList });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', UserDetails: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const addclosingquantity = async (req, res) => {
  try {

    const {assign_id,shop_id,remainquantity,qunatity,closing_date } = req.body;

    const existingClosing = await sequelize.query(
      'SELECT * FROM daily_close_shop_quantity WHERE ass_id = ? AND close_date = ?',
      {
        replacements: [assign_id,closing_date],
        type: QueryTypes.SELECT
      }
    );

    if (existingClosing.length === 0) {
      const result = await sequelize.query(
        'UPDATE assign_shop_product SET quantity = ? WHERE id = ?',
        {
          replacements: [remainquantity,assign_id],
          type: QueryTypes.UPDATE
        }
      );
  
      const resultInsert = await sequelize.query(
        'INSERT INTO daily_close_shop_quantity (ass_id,shop_id,close_quantity,close_date) VALUES (?,?,?,?)',
        {
          replacements: [assign_id,shop_id,qunatity,closing_date],
          type: QueryTypes.INSERT
        }
      );
  
      return res.status(200).send({ error: false, message: 'Quantity Update Successfully'});
    } else {
      return res.status(400).send({ error: true, message: 'Today Quantity already updated'});
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not updated',
      error: true
    });
  }
};

const addopenquantity = async (req, res) => {
  try {

    const {assign_id,shop_id,remainquantity,qunatity,closing_date,amount } = req.body;

    const existingClosing = await sequelize.query(
      'SELECT * FROM dayli_open_shop_quantity WHERE ass_id = ? AND open_date = ?',
      {
        replacements: [assign_id,closing_date],
        type: QueryTypes.SELECT
      }
    );

    if (existingClosing.length === 0) {
      const result = await sequelize.query(
        'UPDATE assign_shop_product SET quantity = ? WHERE id = ?',
        {
          replacements: [remainquantity,assign_id],
          type: QueryTypes.UPDATE
        }
      );
  
      const resultInsert = await sequelize.query(
        'INSERT INTO dayli_open_shop_quantity (ass_id,shop_id,open_quantity,amount,open_date) VALUES (?,?,?,?,?)',
        {
          replacements: [assign_id,shop_id,qunatity,amount,closing_date],
          type: QueryTypes.INSERT
        }
      );
  
      return res.status(200).send({ error: false, message: 'Quantity Update Successfully'});
    } else {
      return res.status(400).send({ error: true, message: 'Today Quantity already updated'});
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not updated',
      error: true
    });
  }
};

const fetchClosingQunatity = async (req, res) => {
  try {

    const { shop_id,close_date } = req.body;
    const existingClosing = await sequelize.query(
      'SELECT daily_close_shop_quantity.*,assign_shop_product.quantity as RQUNT,assign_shop_product.amount as AMT,shop_product.p_name as SPNAME FROM daily_close_shop_quantity INNER JOIN assign_shop_product ON daily_close_shop_quantity.ass_id = assign_shop_product.id INNER JOIN shop_product ON assign_shop_product.p_id = shop_product.id WHERE daily_close_shop_quantity.shop_id = ? AND daily_close_shop_quantity.close_date = ?',
      {
        replacements: [shop_id,close_date],
        type: QueryTypes.SELECT
      }
    ); 

    if(existingClosing.length > 0){
      return res.status(200).send({ error: false, message: 'Data Fetch Successfully', DailyClosing: existingClosing });
    } else {
      return res.status(404).send({ error: true, message: 'Data not found', DailyClosing: [] });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { user_id,status } = req.body;

    const result = await sequelize.query(
      'UPDATE register SET status = ? WHERE id = ?',
      {
        replacements: [status,user_id],
        type: QueryTypes.UPDATE
      }
    );

    res.status(200).json({ error: false, message: 'Update successfully!!!'});
  } catch (error) {
    console.error('Error registering user:', error); // Log the error
    res.status(500).json({ error: true,message: 'Data not Updated!!!' });
  }
};

const fetchTotalCostShop = async (req, res) => {
  try {
    const { todayDate } = req.body;
    
    // First query to fetch shops data
    const allShops = await sequelize.query(
      'SELECT * FROM shops',
      {
        type: QueryTypes.SELECT
      }
    );

    if (allShops.length > 0) {
      // Use Promise.all to execute second query for each shop
      const shopDataWithQuantities = await Promise.all(
        allShops.map(async (shop) => {
          const shopId = shop.id;
          
          // Fetch variable cost (sum of open_quantity * amount)
          const openQuantityData = await sequelize.query(
            `SELECT SUM(open_quantity * amount) AS variableCost
             FROM dayli_open_shop_quantity 
             WHERE shop_id = ? AND open_date = ?`,
            { replacements: [shopId, todayDate], type: QueryTypes.SELECT }
          );
          const variableCost = openQuantityData[0]?.variableCost || 0;

          // Fetch other expenses
          const otherExpenseData = await sequelize.query(
            `SELECT SUM(amount) AS otherExpense
             FROM btoc_expense 
             WHERE shop_id = ? AND add_date = ?`,
            { replacements: [shopId, todayDate], type: QueryTypes.SELECT }
          );
          const otherExpense = otherExpenseData[0]?.otherExpense || 0;
          const costDate = todayDate;

          // Return shop data along with single values for costs
          return {
            ...shop,
            variableCost,
            otherExpense,
            costDate
          };
        })
      );

      return res.status(200).send({
        error: false,
        message: 'Data Fetch Successfully',
        DailyShopCost: shopDataWithQuantities
      });
    } else {
      return res.status(404).send({
        error: true,
        message: 'Data not found',
        DailyShopCost: []
      });
    }

  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: 'Data not found',
      error: true
    });
  }
};


module.exports = {
  login,
  loginUser,
  createInventory,
  fetchCartItems,
  UpdateView,
  addProductCart,
  fetchAllUsers,
  updateUserCart,
  placeOrderByadmin,
  updateProductCart,
  deleteProductCart,
  fetchordersforadmin,
  addCategory,
  fetchCategory,
  placeOrder,
  uploadMiddleware,
  fetchCategorybyId,
  updateCategory,
  deleteCategory,
  fetchActiveCategory,
  fetchInventory,
  addProduct,
  fetchProduct,
  fetchActiveProduct,
  fetchOrder,
  fetchProductAdminById,
  register,
  addsellSugarcane,
  fetchProductAdmin,
  fetchsellSugarcane,
  addPayment,
  addpurchaseSugarcane,
  fetchpurchaseSugarcane,
  addopenquantity,
  addsellTransportcost,
  fetchsellTransportCost,
  addpurchaseTransportCost,
  fetchpurchaseTransportCost,
  adddailyWages,
  fetchdailyWages,
  AddRevenue,
  addDeisleCost,
  fetchDeisleCost,
  fetchsellSugarcaneAllData,
  fetchPaymentHistory,
  createPayment,
  fetchTotalAmount,
  fetchorderdetails,
  deliverOrder,
  fetchAdminPayments,
  fetchAdminHomeData,
  createExpences,
  fetchExpences,
  fetchProfile,
  updateProfile,
  fetchOrdersAndPaymentsForAdmin,
  fetchUserPaymentHistory,
  shopregister,
  updateShop,
  fetchShops,
  assignUsertoShop,
  fetchShopdetails,
  fetchAllRevenueDetails,
  createAttendance,
  fetchattendancbyuser,
  fetchattendancuserbyDate,
  createLeaves,
  fetchleavebyuser,
  fetchleaveuserbyDate,
  createBtoCExpense,
  fetchExpensebyuser,
  addShopProduct,
  updateShopProduct,
  fetchAllShopProduct,
  assignProducttoShop,
  updateassignProducttoShop,
  fetchAllAssignShopProduct,
  employeelogin,
  fetchEmpDetails,
  fetchAllAssignUser,
  addclosingquantity,
  fetchClosingQunatity,
  UpdateRevenue,
  fetchbtocpurchase,
  fetchbtocsell,
  updateUserStatus,
  fetchProductbyID,
  updateProduct,
  fetchAllUsersbyType,
  fetchTotalCostShop
};