module.exports = {
    availabilityToStatus: (isAvailable) => isAvailable ? 'ON' : 'OFF',
    statusToAvailability: (status) => status === 'ON',
    changeStatus: (status) => status === 'ON' ? 'OFF' : 'ON',
}