const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const redis = require('redis')
const client = redis.createClient()

client.on("error", (error)=> {
    console.error(error);
});

const Newspapers = require('../models/newspapers');

const newspaperRouter = express.Router();

newspaperRouter.use(bodyParser.json());

var cors = require('cors');

newspaperRouter.route('/')
.options(cors(), (req,res) => {res.sendStatus(200); })
.get((req,res,next) => {
    Newspapers.find({})
    .then((newspapers) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(newspapers);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put((req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /newspapers');
})
.post((req, res, next) => {
    Newspapers.create(req.body)
    .then((newspaper) => {
        console.log('Newspaper Created ', newspaper);
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(newspaper);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Newspapers.remove({})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));    
});


newspaperRouter.route('/:paperId')
.options(cors(), (req,res) => {res.sendStatus(200); })
// .get((req,res,next) => {
//     Newspapers.findById(req.params.paperId)
//     .then((newspaper) => {
//         res.statusCode = 200;
//         res.setHeader('Content-Type', 'application/json');
//         res.json(newspaper);
//     }, (err) => next(err))
//     .catch((err) => next(err));
// })
.get((req,res,next)=>{
    const search = req.params.paperId
    client.get(search,async(err,data) => {
        if(data) {
            console.log('search from cache')
           return res.status(200).send({
            error: false,
            message: `Data for ${search} from the cache`,
            data : JSON.parse(data)
        })
        }
        else { 
            const data = Newspapers.findById(search);
            client.setEx(search, 1800, JSON.stringify(data));
            console.log('setex')
            return res.status(200).send({
              error: false,
              message: `Data for ${search} from the server`,
              data: data
            });
        }
      }) 
})
.post((req, res, next) => {
  res.statusCode = 403;
  res.end('POST operation not supported on /newspapers/'+ req.params.paperId);
})
.put((req, res, next) => {
    Newspapers.findByIdAndUpdate(req.params.paperId, {
        $set: req.body
    }, { new: true })
    .then((newspaper) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(newspaper);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete((req, res, next) => {
    Newspapers.findByIdAndRemove(req.params.paperId)
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = newspaperRouter;