const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const fileUpload=require('express-fileupload');
const admin = require("firebase-admin");



const port = process.env.PORT || 5000;
// middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

//admin auth
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
     credential: admin.credential.cert(serviceAccount)
});

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugo5b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function verifyToken(req, res, next) {
     if (req.headers?.authorization.startsWith('Bearer ')) {
          const token = req.headers.authorization.split(' ')[1];

          try {
               const decodedUser = await admin.auth().verifyIdToken(token);
               req.decodedEmail = decodedUser.email;
          }
          catch {

          }
     }
     next();
}

async function run() {
     try {
          await client.connect();
          const database = client.db('watchStore');
          const watchCollection = database.collection('watches');
          const orderDataCollection = database.collection('orders');
          const usersCollection = database.collection('users');
          const reviewCollection = database.collection('review')

          // get product all user
          app.get('/products', async (req, res) => {
               const cursor = watchCollection.find({});
               const result = await cursor.toArray();
               res.json(result);
          })
          // get single product all user
          app.get('/products/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: ObjectId(id) };
               const result = await watchCollection.findOne(query);
               res.json(result)

          })
          // post products
          app.post('/products', async (req, res) => {
               const product = req.body;
               console.log(product);
               console.log('file',req.files)
               const result = await watchCollection.insertOne(product);
               res.json(result);
          })
          // delete single product
          app.delete('/products/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: ObjectId(id) };
               const result = await watchCollection.deleteOne(query);
               res.json(result);
          })

          // order data
          //all orders for admin
          app.get('/orders', async (req, res) => {
               const cursor = orderDataCollection.find({});
               const result = await cursor.toArray();
               res.json(result);
          })
          // post api for order user and admin
          app.post('/orders', async (req, res) => {
               const order = req.body;
               const result = await orderDataCollection.insertOne(order);
               res.json(result);
          })
          // get orders specific user
          app.get('/orders/specific', async (req, res) => {
               const email = req.query.email;
               // console.log(req.query.email);
               const query = { email: email };
               const cursor = orderDataCollection.find(query);
               const result = await cursor.toArray();
               console.log(result);
               res.json(result);
          })
          // delete api for single order
          app.delete('/orders/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: ObjectId(id) };
               const result = await orderDataCollection.deleteOne(query);
               res.json(result);
          })


          // user
          // post user for save 
          app.post('/users', async (req, res) => {
               const user = req.body;
               const result = await usersCollection.insertOne(user)
               res.json(result)
          })

          // get user admin
          app.get('/users/:email', async (req, res) => {

               const email = req.params.email;
               const query = { email };
               const user = await usersCollection.findOne(query);
               let isAdmin = false;
               if (user?.role === 'admin') {
                    isAdmin = true;
               }
               res.json({ admin: isAdmin });
          })

          // put user api for admin
          app.put('/users/admin', verifyToken, async (req, res) => {
               const user = req.body;
               const requester = req.decodedEmail;
               if (requester) {
                    const requesterAccount = await usersCollection.findOne({ email: requester });
                    if (requesterAccount.role === 'admin') {
                         const filter = { email: user.email };
                         const updateDoc = { $set: { role: 'admin' } };
                         const result = await usersCollection.updateOne(filter, updateDoc);
                         res.json(result);
                    }
               }
               res.status(403).json({ message: 'you are not ' })

          })

          // review 
          // post api
          app.post('/review', async (req, res) => {
               const user = req.body
               const result = await reviewCollection.insertOne(user);
               res.json(result);
          })
          // get api
          app.get('/review', async (req, res) => {
               const query = reviewCollection.find({});
               const result = await query.toArray();
               res.json(result);
          })



     }
     finally {
          // 
     }

}
run().catch(console.dir);

app.get('/', (req, res) => {
     res.send('hi everyOne')
})

app.listen(port, () => {
     console.log('listing the port', port);
})