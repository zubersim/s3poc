require("dotenv").config();
const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const sharp = require("sharp");

// const connectDB = require("./utils/connectDb");
const Post = require("./schemas/post");

const randomImageNames = (bytes = 32) =>
  crypto.randomBytes(bytes).toString("hex");

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
  region: process.env.BUCKET_REGION,
});

const app = express();

app.use(express.json());

//connectDB();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.get("/api/posts", async (req, res) => {
  const posts = await Post.find({});

  for (const post of posts) {
    // For each post, generate a signed URL and save it to the post object
    const getObjectParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: post.imageName,
    };

    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    post.imageUrl = url;
  }

  res.send(posts);
});

app.post("/api/posts", upload.single("image"), async (req, res) => {
  const imageName = randomImageNames()+'.png';
  // resize image
  const fileBuffer = await sharp(req.file.buffer)
    .resize({ height: 1920, width: 1080, fit: "contain" })
    .toBuffer();

  const params = {
    ACL:"public-read" ,
    Bucket: process.env.BUCKET_NAME,
    Key: imageName,
    Body: fileBuffer,
    ContentType: req.file.mimetype,
  };
  
  //res.json({params}); return;

  const command = new PutObjectCommand(params);

  await s3.send(command);

  // const newPost = await Post.create({
  //   imageName: imageName,
  //   caption: req.body.caption,
  // });

  res.json({imageName});
});

app.delete("/api/posts/:id", async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    res.status(404).send({ message: "Post not found" });
    return;
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: post.imageName,
  };

  const command = new DeleteObjectCommand(params);

  await s3.send(command);

  await Post.deleteOne({ _id: req.params.id });

  res.send({ message: "inside delete -> posts" });
});

app.listen(8080, () => console.log("Server started on port 8080"));
