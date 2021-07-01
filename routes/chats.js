const express = require('express');
const router = express.Router();
const Chat = require('../models/chatModel');
const User = require('../models/userModel');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    const user = await Chat.findOne({ user: userId })
      .populate('chats.messagesWith')
      .sort({ 'chats.messages.date': -1 });
    let chatsToBeSent = [];

    // Sending the required data
    if (user.chats.length > 0) {
      chatsToBeSent = await user.chats.map((chat) => ({
        messagesWith: chat.messagesWith._id,
        name: chat.messagesWith.name,
        profileImage: chat.messagesWith.profileImage,
        lastMessage: chat.messages[chat.messages.length - 1].msg,
        date: chat.messages[chat.messages.length - 1].date,
        gender: chat.messagesWith.gender
      }));
    }
    return res.json(chatsToBeSent);
  } catch (error) {
    console.log(error);
    return res.status(500).send('Server error');
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { userId } = req;
    const user = await Chat.findOne({ user: userId });
    const messages = user.chats.filter(
      (chat) => chat.messagesWith === req.params.id
    );
    console.log(messages);
  } catch (error) {
    console.log(error);
  }
});

router.get('/userInfo/:senderId', authMiddleware, async (req, res) => {
  try {
    const { senderId } = req.params;
    const { name, profileImage } = await User.findById(senderId);
    res.status(200).json({ name, profileImage });
  } catch (error) {
    console.log(error);
    res.status(500).send('Server error');
  }
});

module.exports = router;
