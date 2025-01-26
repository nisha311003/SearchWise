const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');

// MongoDB connection
mongoose.connect('mongodb+srv://searchData:<db_password>@searchbar-cluster.eo9vo.mongodb.net/?retryWrites=true&w=majority&appName=SearchBar-Cluster', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;

// Check MongoDB connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// MongoDB Schema and Model
const PayloadSchema = new mongoose.Schema({
  id: String,
  type: String,
  title: String,
  options: [
    {
      text: String,
      isCorrectAnswer: Boolean,
    },
  ],
});
const Payload = mongoose.model('Payload', PayloadSchema);

// Load your .proto file
const PROTO_PATH = './payload.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const payloadProto = grpc.loadPackageDefinition(packageDefinition).payload;

// Create an Express app
const app = express();

app.use(cors()); // Enable CORS
app.use(bodyParser.json()); // Parse JSON request bodies

// Define the GET endpoint
app.get('/payload.PayloadService/SearchByTitle', async (req, res) => {
  console.log('Query:', req.query.query);
  const query = req.query.query; // Extract the 'query' parameter from the URL

  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required.' });
  }

  try {
    // Search in MongoDB for documents matching the query
    const results = await Payload.find(
      {
        $or: [
          { title: { $regex: query, $options: 'i' } }, // Matches in title
          { solution: { $regex: query, $options: 'i' } }, // Matches in solution
        ],
      },
      'type title options' // Retrieve specific fields
    );
    console.log(results);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No results found.' });
    }

    // Map the results to include options for MCQ types
    const mappedResults = results.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      type: doc.type,
      options: doc.type === 'MCQ' ? doc.options : undefined, // Include options only for MCQ types
    }));

    // Send the results back to the client
    res.json(mappedResults);
  } catch (err) {
    console.error('Error fetching data from MongoDB:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// Start the Express server
const PORT = 8080; // The port your frontend will communicate with
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});