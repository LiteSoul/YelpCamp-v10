const express = require('express')
const router = express.Router()
//models require
const Campground = require('../models/campground')

//CREATE route - add new campground to DB
router.post('/campgrounds', isLoggedIn, function(req, res) {
	// get data from form and add to campgrounds array
	var name = req.body.name
	var image = req.body.image
	var description = req.body.description
	let author = {
		id: req.user._id,
		username: req.user.username
	}
	var newCampground = {
		name,
		image,
		description,
		author
	}
	//Create a new campground and save it to DB:
	Campground.create(newCampground, function(err, new_camp) {
		if (err) {
			console.log(err)
		} else {
			console.log(new_camp)
			// redirect back to campgrounds, default is GET campgrounds:
			res.redirect('/campgrounds')
		}
	})
})

//NEW - show form to create new campground
router.get('/campgrounds/new', isLoggedIn, function(req, res) {
	res.render('campgrounds/new')
})

//SHOW - show info about a single camp ID
router.get('/campgrounds/:id', function(req, res) {
	//find the campground with provided id
	//that :id is being captured here with .params
	//mongoose gives us this method: .findById(id,callback)
	//comments are coming back with an array of ObjectId,so we need to .populate.exec
	//to populate the found campground with the comments
	Campground.findById(req.params.id)
		.populate('comments')
		.exec(function(err, foundCamp) {
			if (err) {
				console.log(err)
			} else {
				//render show template with that campground
				res.render('campgrounds/show', {
					campground: foundCamp
				})
			}
		})
})

// EDIT CAMPGROUND ROUTE
router.get('/campgrounds/:id/edit', checkCampOwnership, (req, res) => {
	Campground.findById(req.params.id, (err, foundCamp) => {
		res.render('campgrounds/edit', {
			campground: foundCamp
		})
	})
})
// UPDATE CAMPGROUND ROUTE
router.put('/campgrounds/:id', (req, res) => {
	//find and update the correct campground
	Campground.findByIdAndUpdate(
		req.params.id,
		req.body.campground,
		(err, updatedCamp) => {
			if (err) res.redirect('/campgrounds')
			else res.redirect(`/campgrounds/${req.params.id}`)
		}
	)
})
// DESTROY CAMPGROUND ROUTE
router.delete('/campgrounds/:id', (req, res) => {
	Campground.findByIdAndRemove(req.params.id, (err, deletedCamp) => {
		if (err) res.redirect(`/campgrounds/${req.params.id}`)
		else res.redirect('/campgrounds')
	})
})

//MIDDLEWARE use these after a route, before the callback
//checks if is logged in before doing the next step
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}
	res.redirect('/login')
}
//checks if the current user is the owner (author) of the current campground
function checkCampOwnership(req, res, next) {
	if (req.isAuthenticated()) {
		Campground.findById(req.params.id, (err, foundCamp) => {
			if (err) res.redirect('back')
			else {
				//	//does user own campground?
				//mongoose stores authorid as an mongoose object, not string so to compare them
				// we use mongoose method equals()
				if (foundCamp.author.id.equals(req.user._id)) next()
				else res.redirect('back')
			}
		})
	} else res.redirect('back') //takes the user to the 'previous' page
}

module.exports = router
