// tis file contains all endpoints related to url's shortening.

const Express = require('express');
const router = Express.Router();
const shortid = require('shortid');
const Url = require('../models/Url');
const env = require('dotenv')

// configure environment variables.
env.config()

function validateUrl(value) {
    return /^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/i.test(
      value
    );
  }


router.post("/short", async (request, response) => {
    const {originalUrl} = request.body;
    const base = process.env.BASE;

    const urlId = shortid.generate();
    if(validateUrl(originalUrl)){
        try{
            let url = await Url.findOne({originalUrl});
            if(url){
                response.json(url).status(200)
            }
            else{
                const shortUrl = `${base}/${urlId}`;
                url = new Url({
                    originalUrl,
                    shortUrl,
                    urlId,
                    date: new Date(),
                });

                await url.save();
                response.status(200).json(url);
            }
        }catch(error){
            console.log(error);
            response.json("server error").status(500);
        }
    }
    else{
        response.status(400).json("Invalid original Url");
    }
})


router.get('/:Id', async (request, response) => {
    try{
        const url = await Url.findOne({urlId: request.params.Id});
        if(url){
            url.clicks++;
            url.save();
            return response.redirect(url.originalUrl);
        }
        else{
            response.status(404),json("Url not found")
        }
    }catch(error){
        console.log(error);
        response.status(500).json("Internam server error")
    }
})



module.exports = router; 