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



const generateToken = (user) => {
  const payload = {
    email: user.email,
    password: user.password,
    id: user.id,
  };
  return jwt.sign(payload, 'crud', { expiresIn: '24h' });
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'sponda.netclues@gmail.com',
    pass: 'qzfm wlmf ukeq rvvb'
  }
});

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

const sendPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = generateOTPS();
    console.log(otp);



    // Send OTP via email
    await sendEmail({
      to: email,
      subject: 'Your OTP',
      message: `<p>Your OTP is: <strong>${otp}</strong></p>`,
    });

    res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}

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

const fetchProduct = async (req, res) => {
  try {
    const { userId } = req.body;

    log

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
    const { name,nName, oMobile,eMobile,landmark,sImage,block,password } = req.body;

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
        'INSERT INTO register (name, nName,oNumber,eNumber,landmark,sImages,block,password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        {
          replacements: [name,nName,oMobile,eMobile,landmark,imagePath,block,password],
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
  const { userId, price } = req.body;

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
        'INSERT INTO paymentdone (user_id, order_id, amount,status) VALUES (?, ?, ?,?)',
        { replacements: [userId, order.id, price,'0'], type: QueryTypes.INSERT }
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
      { replacements: [user_id, "0"], type: QueryTypes.SELECT }
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
      'DELETE FROM cart WHERE id = ?',
      {
        replacements: [cartId],
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
    // Query to fetch data from transportcost_sell and transportcost_purchase with required calculations
    const productList = await sequelize.query(`
      SELECT 
        ts.agent_name,
        SUM(ts.wieght) AS total_weight,
        AVG(ts.rate) AS average_rate,
        SUM(ts.amount) AS total_sell_amount,
        COALESCE(SUM(ts.amount) - COALESCE(SUM(tp.amount), 0), SUM(ts.amount)) AS final_amount
      FROM transportcost_sell ts
      LEFT JOIN transportcost_purchase tp 
        ON ts.agent_name = tp.agent_name
      GROUP BY ts.agent_name
    `, {
      type: QueryTypes.SELECT
    });

    if (productList.length > 0) {
      // Convert each value in the result to a string for consistency
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
  const { agentName } = req.params; // Get farmer name from request parameters

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
       WHERE user_id = ?`,
      {
        replacements: [userId],
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

    const productList = await sequelize.query('SELECT orders.*,register.name as NAME,register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id',
      { replacements: [], type: QueryTypes.SELECT }); 

    if(productList.length > 0){
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


const fetchAllUsers = async (req, res) => {
  try {

    const productList = await sequelize.query('SELECT * FROM register',
      { replacements: [], type: QueryTypes.SELECT }); 

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




// const fetchorderdetails = async (req, res) => {
//   try {

//     const { oId } = req.params;

//     const productList = await sequelize.query('SELECT orders.*,register.name as NAME,register.oNumber as OPHONE FROM orders INNER JOIN register ON orders.user_id = register.id WHERE orders.id = ?',
//       { replacements: [oId], type: QueryTypes.SELECT }); 

//     if(productList.length > 0){

//       const cartItems = await sequelize.query('SELECT * FROM cart WHERE order_id = ?', 
//       { 
//         replacements: [oId], 
//         type: QueryTypes.SELECT 
//       });
  
//       // Combine order details with cart items
//       const orderWithCartItems = {
//         ...productList[0],  // Assuming there's only one order
//         cartItems: cartItems // Array of cart items
//       };

//       return res.status(200).send({ error: false, message: 'Data Fetch Successfully', OrderDetails: orderWithCartItems });
//     } else {
//       return res.status(404).send({ error: true, message: 'Data not found', OrderDetails: [] });
//     }

//   } catch (error) {
//     console.log(error);
//     res.status(500).send({
//       message: 'Data not found',
//       error: true
//     });
//   }
// };

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

module.exports = {
  login,
  loginUser,
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
  addProduct,
  fetchProduct,
  fetchActiveProduct,
  fetchOrder,
  register,
  addsellSugarcane,
  fetchProductAdmin,
  fetchsellSugarcane,
  addPayment,
  addpurchaseSugarcane,
  fetchpurchaseSugarcane,
  addsellTransportcost,
  fetchsellTransportCost,
  addpurchaseTransportCost,
  fetchpurchaseTransportCost,
  adddailyWages,
  fetchdailyWages,
  addDeisleCost,
  fetchDeisleCost,
  fetchsellSugarcaneAllData,
  fetchPaymentHistory,
  createPayment,
  fetchTotalAmount,
  fetchorderdetails
};