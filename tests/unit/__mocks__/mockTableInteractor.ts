const mock = jest.fn().mockImplementation(() => ({
    userAlreadyExists(
        mobile: String
        ): boolean {
            throw null
        }
}));

export default mock;