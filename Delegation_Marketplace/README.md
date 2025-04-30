# STX Delegator

A Stacks blockchain smart contract for facilitating STX token delegation to PoX (Proof of Transfer) addresses.

## Overview

STX Delegator is a specialized contract designed to act as a secure intermediary for delegating STX tokens to miners participating in the Stacks blockchain's Proof of Transfer (PoX) consensus mechanism. It enables a trusted delegation marketplace to programmatically delegate tokens on behalf of users without requiring direct access to their STX tokens.

## Features

- **Marketplace Integration**: Works with a designated delegation marketplace contract to process delegation requests
- **PoX Address Validation**: Validates the format of PoX addresses before processing delegations
- **Security Controls**: Implements strict access controls to prevent unauthorized delegations
- **Administrative Management**: Allows the contract owner to update the authorized marketplace contract

## Smart Contract Functions

### Administrative Functions

| Function | Description | Access |
|----------|-------------|--------|
| `set-marketplace-contract` | Update the authorized marketplace contract address | Owner only |

### Delegation Operations

| Function | Description | Access |
|----------|-------------|--------|
| `delegate-to-pox` | Delegate STX tokens to a specified PoX address | Marketplace contract only |
| `revoke-delegation` | Revoke an existing delegation | Marketplace contract only |

### Read-Only Functions

| Function | Description | Access |
|----------|-------------|--------|
| `get-marketplace-contract` | Get the current authorized marketplace contract address | Public |
| `is-valid-pox-address` | Check if a PoX address has valid formatting | Public |

## Default Configuration

The contract is pre-configured with:
- The deploying address as the contract owner
- The delegation marketplace contract (`ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.delegation-marketplace`) as the authorized marketplace

## Error Codes

| Code | Description |
|------|-------------|
| `u100` | Owner-only function called by non-owner |
| `u101` | Unauthorized caller (not the marketplace contract) |
| `u102` | Invalid PoX address format |
| `u103` | Delegation operation failed |

## Implementation Notes

This is a simplified implementation that demonstrates the architecture of a delegation system. In a production environment:

- The contract would integrate with the actual Stacks PoX contract
- Additional validation and error handling would be implemented
- More sophisticated permission models might be used

## Usage

### Deployment

Deploy the contract using Clarinet or directly through the Stacks blockchain:

```bash
# Using Clarinet
clarinet deploy --costs

# Using Stacks CLI
stacks-cli deploy stx-delegator.clar --fee 10000
```

### Interacting with the Contract

#### Updating the Marketplace Contract

As the contract owner:

```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stx-delegator set-marketplace-contract 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG.new-marketplace)
```

#### Delegating STX (from the marketplace contract)

From the authorized marketplace contract:

```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stx-delegator delegate-to-pox
  u1000000
  {version: 0x01, hashbytes: 0x1111111111111111111111111111111111111111}
  u100000
  u12)
```

#### Checking Address Validity

```clarity
(contract-call? 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM.stx-delegator is-valid-pox-address
  {version: 0x01, hashbytes: 0x1111111111111111111111111111111111111111})
```

## Development

### Prerequisites

- [Clarinet](https://github.com/hirosystems/clarinet) for local development and testing
- [Stacks CLI](https://docs.stacks.co/stacks-blockchain/cli) for deployment to testnet/mainnet

### Testing

A comprehensive test suite should be developed to cover:
- Administrative functions
- Delegation operations
- Address validation
- Error conditions

Example test command:

```bash
clarinet test
```

## Integration with Delegation Marketplace

This contract is designed to work with a companion contract called `delegation-marketplace`. In the complete system:

1. Users interact with the marketplace contract
2. The marketplace contract calls this delegator contract
3. The delegator contract interacts with the Stacks PoX system

This separation of concerns improves security and modularity.

## Security Considerations

- Only the authorized marketplace contract can execute delegations
- The contract owner has the ability to change the marketplace contract address
- PoX addresses are validated before delegation attempts
- In a production environment, additional security measures would be implemented

## Extending the Contract

To extend this contract for production use:
1. Implement the actual PoX contract integration
2. Add support for delegation rewards tracking
3. Add more sophisticated validation
4. Consider implementing time-locks or multi-signature requirements

## License

[MIT License](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request