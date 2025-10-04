const Communication = require('../models/communicationModel');
const User = require('../models/userModel'); // To get user details

/**
 * Get the list of contacts for the logged-in user.
 */
const getContacts = async (req, res) => {
  try {
    // We need the full user object including depot_id and region_id
    const fullUser = await User.findById(req.user.userId);
    const roleDetails = await User.getRoleSpecificDetails(req.user.userId, fullUser.role_name);

    const userContext = {
      userId: req.user.userId,
      role: fullUser.role_name,
      depot_id: roleDetails?.depot_id,
      region_id: roleDetails?.region_id,
    };

    // Ensure depot/region staff have the necessary IDs to find contacts
    if ((userContext.role.startsWith('depot_') && (!userContext.depot_id || !userContext.region_id)) || (userContext.role.startsWith('regional_') && !userContext.region_id)) {
        return res.status(400).json({ error: 'User is missing required depot or region association.' });
    }

    const contacts = await Communication.getContacts(userContext);

    // Format the response to match the frontend's expectation
    const formattedContacts = contacts.map(c => ({
        id: c.user_id,
        name: `${c.first_name} ${c.last_name}`,
        role: c.role_name,
        depot: c.depot_name,
        region: c.region_name,
        avatar: `https://placehold.co/100x100/E2E8F0/4A5568?text=${c.first_name[0]}${c.last_name[0]}`
    }));

    res.json(formattedContacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Server error while fetching contacts.' });
  }
};

// We will add more functions here for:
// - getConversations
// - getMessagesForConversation
// - sendMessage
// - getAnnouncements

module.exports = {
  getContacts,
};
