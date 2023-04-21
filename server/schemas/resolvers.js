const { AuthenticationError } = require('apollo-server-express');
const { User, Book } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
	Query: {
		me: async (parent, { username, email, password }, context) => {
			if (context.user) {
				const userData = await User.findOne({ _id: context.user._id })
				.select('-__v -password')
				.populate('savedbooks');

				return userData;
			}
			throw new AuthenticationError('not logged in');
		},
	},

	Mutation: {
		addUser: async (parent, { username, email, password }) => {
			const user = await User.create({ username, email, password });
			const token = signToken(user);
			return { token, user };
		},

		login: async (parent, { username, email, password }) => {
			const user = await User.findOne({ email });
			if (!user) {
				throw new AuthenticationError('Incorrect email address or password')
			}
			const CorrectPassword = await user.isCorrectPassword(password);
			if (!CorrectPassword) {
				throw new AuthenticationError('Incorrect email address or password')
			}
			const token = signToken(user);
			return { token, user };
		},
		
		saveBook: async (parent, { input }, context) => {
			if (context.user) {
				const updatedBooks = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $addToSet: { savedBooks: input } },
					{ new: true }
				).populate('savedBooks');

				return updatedBooks;
			}
		},

		removeBook: async (parent, { bookId }, context) => {
			if (context.user) {
				const updatedBooks = await User.findOneAndUpdate(
					{ _id: context.user._id },
					{ $pull: { savedBooks: { bookId } } },
					{ new: true }
				);

				return updatedBooks;
			}
		}
	}
}

module.exports = resolvers;
