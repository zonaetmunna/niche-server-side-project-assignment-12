const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;



const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ugo5b.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
     try {
          await client.connect();
          const database = client.db('watchStore');
          const watchCollection = database.collection('watches');

          // get product
          app.get('/products', async (req, res) => {
               const cursor = watchCollection.find({});
               const result = await cursor.toArray();
               res.json(result);
          })
          // get single product
          app.get('/products/:id', async (req, res) => {
               const id = req.params.id;
               const query = { _id: ObjectId(id) };
               const result = await watchCollection.findOne(query);
               res.json(result)

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