const grpc = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const mongoose = require('mongoose');
const Payload = require('./models/payload');
// MongoDB connection string
const url = 'mongodb+srv://searchData:search3126@searchbar-cluster.eo9vo.mongodb.net/?retryWrites=true&w=majority&appName=SearchBar-Cluster';
async function connect() {
  try {
    await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error(err);
  }
}
connect();

// async function listAllDocuments() {
//   try {
//     const results = await Payload.find(); // Fetch all documents
//     console.log("All Documents:", results);
//   } catch (error) {
//     console.error("Error fetching documents:", error);
//   }
// }

// listAllDocuments();

// Search by title method for gRPC server
async function searchByTitle(call, callback) {
  console.log('gRPC call received with query:', call.request.query);
  const query = call.request.query;
  
  if (!query) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'Query parameter is required',
    });
  }

  try {
    // Query MongoDB for documents matching the query in the title or other relevant fields
    const results = await Payload.find(
      {
        $or: [
          { title: { $regex: query, $options: 'i' } }, // Matches in title
          { solution: { $regex: query, $options: 'i' } }, // Matches in solution
        ]
      },
      'type title options' // Return only type, title, and options fields
    ).limit(10);

    // Map the results to the expected response format
    const response = {
      payloads: results.map(payload => ({
        _id: payload._id.toString(),
        type: payload.type,
        title: payload.title,
        options: payload.type === 'MCQ' ? payload.options : undefined, // Include options only for MCQ
      })),
    };

    // Return the response to the client
    callback(null, response);
  } catch (error) {
    console.error("Search Error:", error);
    callback({
      code: grpc.status.INTERNAL,
      details: 'Internal server error',
    });
  }
}

// Load the .proto file for gRPC
const PROTO_PATH = './payload.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const payloadProto = grpc.loadPackageDefinition(packageDefinition).payload;


// Create the gRPC server
const server = new grpc.Server();

// Add the new method to the server
server.addService(payloadProto.PayloadService.service, {
  SearchByTitle: searchByTitle,  // This is the new method
});

// Start the gRPC server
server.bindAsync('127.0.0.1:50051', grpc.ServerCredentials.createInsecure(), (err, port) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(`Server is running on port ${port}`);
  server.start();
});