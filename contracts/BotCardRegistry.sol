// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BotCardRegistry
 * @notice Lightweight, gas-optimized decentralized contact card registry for Botchain.
 * @dev Supports Personal (0) and Business (1) profiles. Each wallet address owns at most one profile.
 */
contract BotCardRegistry {
    uint8 public constant PROFILE_PERSONAL = 0;
    uint8 public constant PROFILE_BUSINESS = 1;

    uint256 public constant MAX_NAME_LENGTH = 80;
    uint256 public constant MAX_HEADLINE_LENGTH = 120;
    uint256 public constant MAX_BIO_LENGTH = 500;
    uint256 public constant MAX_EMAIL_LENGTH = 120;
    uint256 public constant MAX_WEBSITE_LENGTH = 160;
    uint256 public constant MAX_SOCIAL_LENGTH = 80;
    uint256 public constant MAX_LOCATION_LENGTH = 100;

    struct Profile {
        string name;
        string headline;
        string bio;
        string email;
        string website;
        string socialHandle;
        string location;
        uint8 profileType;
        bool exists;
    }

    mapping(address => Profile) private profiles;
    uint256 public totalProfiles;

    event ProfileUpdated(address indexed wallet, uint8 profileType);

    error ProfileAlreadyExists();
    error ProfileDoesNotExist();
    error InvalidProfileType();
    error InvalidNameLength();
    error StringTooLong();
    error Unauthorized();

    /**
     * @notice Create a new contact card profile for the caller's wallet.
     */
    function createProfile(
        string calldata name,
        string calldata headline,
        string calldata bio,
        string calldata email,
        string calldata website,
        string calldata socialHandle,
        string calldata location,
        uint8 profileType
    ) external {
        if (profiles[msg.sender].exists) revert ProfileAlreadyExists();
        if (profileType > PROFILE_BUSINESS) revert InvalidProfileType();

        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) {
            revert InvalidNameLength();
        }
        if (
            bytes(headline).length > MAX_HEADLINE_LENGTH ||
            bytes(bio).length > MAX_BIO_LENGTH ||
            bytes(email).length > MAX_EMAIL_LENGTH ||
            bytes(website).length > MAX_WEBSITE_LENGTH ||
            bytes(socialHandle).length > MAX_SOCIAL_LENGTH ||
            bytes(location).length > MAX_LOCATION_LENGTH
        ) {
            revert StringTooLong();
        }

        Profile storage p = profiles[msg.sender];
        p.name = name;
        p.headline = headline;
        p.bio = bio;
        p.email = email;
        p.website = website;
        p.socialHandle = socialHandle;
        p.location = location;
        p.profileType = profileType;
        p.exists = true;

        unchecked {
            ++totalProfiles;
        }
        emit ProfileUpdated(msg.sender, profileType);
    }

    /**
     * @notice Update the existing contact card profile owned by the caller's wallet.
     */
    function updateProfile(
        string calldata name,
        string calldata headline,
        string calldata bio,
        string calldata email,
        string calldata website,
        string calldata socialHandle,
        string calldata location,
        uint8 profileType
    ) external {
        if (!profiles[msg.sender].exists) revert ProfileDoesNotExist();
        if (profileType > PROFILE_BUSINESS) revert InvalidProfileType();

        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) {
            revert InvalidNameLength();
        }
        if (
            bytes(headline).length > MAX_HEADLINE_LENGTH ||
            bytes(bio).length > MAX_BIO_LENGTH ||
            bytes(email).length > MAX_EMAIL_LENGTH ||
            bytes(website).length > MAX_WEBSITE_LENGTH ||
            bytes(socialHandle).length > MAX_SOCIAL_LENGTH ||
            bytes(location).length > MAX_LOCATION_LENGTH
        ) {
            revert StringTooLong();
        }

        Profile storage p = profiles[msg.sender];
        p.name = name;
        p.headline = headline;
        p.bio = bio;
        p.email = email;
        p.website = website;
        p.socialHandle = socialHandle;
        p.location = location;
        p.profileType = profileType;
        p.exists = true;

        emit ProfileUpdated(msg.sender, profileType);
    }

    /**
     * @notice Update a profile specifying the target owner address (only owner is authorized).
     */
    function updateProfileFor(
        address wallet,
        string calldata name,
        string calldata headline,
        string calldata bio,
        string calldata email,
        string calldata website,
        string calldata socialHandle,
        string calldata location,
        uint8 profileType
    ) external {
        if (msg.sender != wallet) revert Unauthorized();
        if (!profiles[wallet].exists) revert ProfileDoesNotExist();
        if (profileType > PROFILE_BUSINESS) revert InvalidProfileType();

        if (bytes(name).length == 0 || bytes(name).length > MAX_NAME_LENGTH) {
            revert InvalidNameLength();
        }
        if (
            bytes(headline).length > MAX_HEADLINE_LENGTH ||
            bytes(bio).length > MAX_BIO_LENGTH ||
            bytes(email).length > MAX_EMAIL_LENGTH ||
            bytes(website).length > MAX_WEBSITE_LENGTH ||
            bytes(socialHandle).length > MAX_SOCIAL_LENGTH ||
            bytes(location).length > MAX_LOCATION_LENGTH
        ) {
            revert StringTooLong();
        }

        Profile storage p = profiles[wallet];
        p.name = name;
        p.headline = headline;
        p.bio = bio;
        p.email = email;
        p.website = website;
        p.socialHandle = socialHandle;
        p.location = location;
        p.profileType = profileType;
        p.exists = true;

        emit ProfileUpdated(wallet, profileType);
    }

    /**
     * @notice Retrieve the profile associated with a wallet address.
     */
    function getProfile(address wallet) external view returns (Profile memory) {
        return profiles[wallet];
    }

    /**
     * @notice Check whether a wallet address has a registered profile.
     */
    function hasProfile(address wallet) external view returns (bool) {
        return profiles[wallet].exists;
    }
}
