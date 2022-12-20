const User = require('../models/user')
const jwt = require('jsonwebtoken')
const Postdata = require('../models/post')
const app = require('../../firebase')
const { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } = require('firebase/auth')
const { async } = require('@firebase/util')




const authen = getAuth(app)

// TODO: User Registration 


exports.Register = async (req, res) => {
    try {
        const { name, email, password, cpassword } = req.body
        console.log('res',req.body)
        if (!name) {
            return res.status(400).json('Fill the name field')
        }
        if (!email) {
            return res.status(400).json('Fill the email field')
        }
        if (!password) {
            return res.status(400).json('Fill the password field')
        }
        if (!cpassword) {
            return res.status(400).json('Fill the confirm password field')
        }
        const exuser = await User.findOne({ email })
        if (exuser) {
            return res.status(400).json('User with this email id already exists')
        }
        if (password === cpassword) {
            const UserCredentialImpl = await createUserWithEmailAndPassword(authen, email, password)
            if (UserCredentialImpl) {
                const ver = await sendEmailVerification(UserCredentialImpl.user)
                const newuser = new User({
                    name,
                    email:email?.toLowerCase()
                })
                const saveduser = await newuser.save()
                res.status(201).json(saveduser)

            }
        } else {
            return res.status(400).json('Password and Confirm Password are not same')
        }



    } catch (error) {
        return res.status(400).json(error?.message)
    }
}


// TODO:User Login

exports.Login = async (req, res) => {
    try {
        const { email, password } = req.body
        console.log('ss', req.body)

        if (!email) {
            return res.status(400).json('Fill the email field')
        }
        if (!password) {
            return res.status(400).json('Fill the password field')
        }
        const exuser = await User.findOne({ email:email?.toLowerCase() })
        console.log(exuser)

        if (exuser) {
            const verify = await signInWithEmailAndPassword(authen, email, password)
            // res.json()
            if (verify?.user.emailVerified) {
                const token = jwt.sign({ id: exuser._id }, process.env.SEC_KEY)
                res.status(200).json(token)



            } else {
                return res.status(400).json('Email is not verified')
            }
        } else {
            return res.status(400).json('Check all the fields')
        }

    } catch (error) {
        return res.status(400).json(error?.message)
    }
}

// TODO:Reset Password

exports.Reset = async (req, res) => {
    try {
        console.log(authen)
        const reset = await sendPasswordResetEmail(authen, req.body.email)
        res.status(200).json("Reset Link Send")
    } catch (error) {
        console.log(error?.message)
        return res.status(400).json(error?.message)

    }
}


// TODO: Load User

exports.loadUser = async (req, res, next) => {
    console.log(req.user)
    const finduser = await User.findById(req.user).populate('following', 'name email profilePic following followers').populate('followers', 'name email following profilePic followers')
    res.status(200).json(finduser)

}

// TODO: Get LoggedIn User 

exports.getUser = async (req, res) => {
    try {
        const find = await User.findOne({ email: req.params.id }).populate('following', 'name email profilePic following followers').populate('followers', 'name email following profilePic followers')
        res.status(200).json(find)
    } catch (error) {

    }
}

// TODO: Update User 

exports.updateUser = async (req, res) => {
    try {
        const find = await User.findByIdAndUpdate(req.user,req.body)
        res.status(200).json(find)
    } catch (error) {

    }
}

// TODO: Follow User

exports.Follow = async (req, res) => {
    try {

        const follow = await User.findByIdAndUpdate(req.body.followId, {
            $push: { followers: req.user }
        }, {
            new: true
        })
        if (follow) {
            const following = await User.findByIdAndUpdate(req.user, {
                $push: { following: req.body.followId }
            }, {
                new: true
            })
            res.json(following)
        } else {
            res.status(400).json("auth follow failed")
        }



    } catch (error) {

    }
}
// TODO: Unfollow User

exports.unFollow = async (req, res) => {
    try {

        const follow = await User.findByIdAndUpdate(req.body.followId, {
            $pull: { followers: req.user }
        }, {
            new: true
        })
        if (follow) {
            const following = await User.findByIdAndUpdate(req.user, {
                $pull: { following: req.body.followId }
            }, {
                new: true
            })
            res.json(following)
        } else {
            res.status(400).json( "auth follow failed")
        }



    } catch (error) {

    }
}

// TODO: Create Post 

exports.postData = async (req, res) => {
    try {
        const { body, photo } = req.body;
        const date = new Date().toDateString()
        const data = await User.findById(req.user)
        if (!data) {
            return res.status(400).json('auth fail')
        }
        data.password = undefined;
        data.cpassword = undefined
        const itemData = new Postdata({
            body,
            photo,
            postedBy: data,
            date
        })
        const itemSave = await itemData.save()
        res.json(itemSave)
    } catch (error) {
        res.status(400).json({
            msg: error
        })
    }
}

// TODO:Get All Posts

exports.getPost = async (req, res) => {
    try {
        const all = await Postdata.find().sort({ "_id": -1 }).populate('postedBy', ' name profilePic email').populate("comments.postedBy", "name profilePic email")
        // const all = await Postdata.aggregate([
        //     {$match:{date:"Sun Jun 05 2022"}},
        //     {$lookup:{from:'users',localField:'postedBy',foreignField:'_id',as:'postedBy'}},
        //     {$ 
            
       
        //     }
        // ])
        res.status(200).json(all)
    } catch (error) {
        console.log(error)

    }
}

// TODO:Get My Posts

exports.getMyPost = async (req, res) => {
    try {
        const all = await Postdata.find({ "postedBy": req.user }).sort({ "_id": -1 }).populate('postedBy', ' name profilePic email').populate("comments.postedBy", "name profilePic email")
        res.status(200).json(all)
    } catch (error) {

    }
}
// TODO: Get Post By User
exports.getPostByUser = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.params.id })
        if (user) {
            const all = await Postdata.find({ "postedBy": user._id }).sort({ "_id": -1 }).populate('postedBy', ' name profilePic email').populate("comments.postedBy", "name profilePic email")
            res.status(200).json(all)
        }


    } catch (error) {

    }
}

// TODO: DELETE POST

exports.deletePost = async(req,res) =>{
    try {
        console.log('vv',req.params.id)
        const del = await Postdata.findByIdAndDelete(req.params.id)
        res.status(200).json(del)
    } catch (error) {
        
    }
}

// TODO: GET ALL USER

exports.allUsers = async (req, res) => {
    try {
        const alluser = await User.find()
        res.status(200).json(alluser)
    } catch (error) {

    }

}

// TODO:Update Profile Pic 

exports.updatePic = async (req, res) => {
    const update = await User.findByIdAndUpdate(req.user, req.body,{new:true} )
    res.status(200).json(update)
}

// TODO:Like

exports.Likes = async (req, res) => {
    try {
        const likedata = await Postdata.findByIdAndUpdate(req.body.postId, {
            $push: { likes: req.user }
        }, {
            new: true
        })
        res.json(likedata)

    } catch (error) {
        console.log(error)
    }
}

// TODO: Dislike
exports.Dislikes = async (req, res) => {
    try {
        const likedata = await Postdata.findByIdAndUpdate(req.body.postId, {
            $pull: { likes: req.user }
        }, {
            new: true
        })
        res.json(likedata)

    } catch (error) {
        console.log(error)
    }
}
// TODO: Get Followers Data
exports.getFollowers = async (req, res) => {
    try {
        const followers = await User.findOne({ email: req.body.email }).populate('followers', 'name email')
        res.status(200).json(followers)
    } catch (error) {

    }
}

// TODO: Get Following Data
exports.getFollowing = async (req, res) => {
    try {
        const followers = await User.findOne({ email: req.body.email }).populate('following', 'name email')
        res.status(200).json(followers)
    } catch (error) {

    }
}
// TODO: Comment
exports.Comment = async (req, res) => {
    try {
        const user = await User.findById(req.user)
        console.log(user)
        const date = new Date().toDateString()
        const comment = {
            text: req.body.text,
            postedBy: user._id,
            date
        }
        const likedata = await Postdata.findByIdAndUpdate(req.body.postId, {
            $push: { comments: comment }
        }, {
            new: true
        }).populate("comments.postedBy", "_id name")
        res.json(likedata)
    } catch (error) {

    }
}
// TODO: Get Posts Of Followers
exports.myFollowPost = async (req, res) => {
    try {
        const user = await User.findById(req.user)

        const dataitem = await Postdata.find({$or:[{ postedBy: { $in: user.following }  },{ postedBy: req.user  }]} ).sort({"_id":-1}).populate('postedBy', ' name profilePic email').populate("comments.postedBy", "name profilePic email")
        res.status(200).json(dataitem)
    } catch (error) {

    }
}



// TODO : Get Suggestion

exports.suggestion = async(req,res)=>{
    try {
        const find = await User.aggregate([
            {$match:{email:"sansaha0505@gmail.com"}},
            {$group:{
                _id:"$email"
            }}
            // {$}
        ])
        res.json(find)
        // const find = await User.findById('629bb5209594438e82f6c670').populate('following', 'name email profilePic followers').populate('followers', 'name email profilePic')
        // if(find){
        //     const setdata = (find?.followers?.concat(find?.following))
        //     if(setdata){
        //         setdata?.map((v,i)=>{
        //             console.log(v)
        //         })

        //     }
        //     // res.json(setdata)
        // }

       
    } catch (error) {
        console.log(error)
        
    }
}
