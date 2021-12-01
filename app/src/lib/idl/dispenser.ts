export type Dispenser = {
  "version": "0.0.0",
  "name": "dispenser",
  "instructions": [
    {
      "name": "createRegistry",
      "accounts": [
        {
          "name": "registry",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenIn",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintTokenOut",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rateTokenIn",
          "type": "u64"
        },
        {
          "name": "rateTokenOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateRegistry",
      "accounts": [
        {
          "name": "registry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "rateTokenIn",
          "type": "u64"
        },
        {
          "name": "rateTokenOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swapper",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenInAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenOutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountRequested",
          "type": "u64"
        }
      ]
    },
    {
      "name": "collectProceeds",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminProceedsAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "collectReserve",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "adminReserveAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "registry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "vaultTokenIn",
            "type": "publicKey"
          },
          {
            "name": "vaultTokenOut",
            "type": "publicKey"
          },
          {
            "name": "rateTokenIn",
            "type": "u64"
          },
          {
            "name": "rateTokenOut",
            "type": "u64"
          },
          {
            "name": "mintTokenIn",
            "type": "publicKey"
          },
          {
            "name": "mintTokenOut",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InsufficientUserFunds",
      "msg": "Insufficient user funds"
    },
    {
      "code": 301,
      "name": "InsufficientVaultFunds",
      "msg": "Insufficient vault funds"
    },
    {
      "code": 302,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    }
  ]
};

export const IDL: Dispenser = {
  "version": "0.0.0",
  "name": "dispenser",
  "instructions": [
    {
      "name": "createRegistry",
      "accounts": [
        {
          "name": "registry",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "mintTokenIn",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "mintTokenOut",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "rent",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "rateTokenIn",
          "type": "u64"
        },
        {
          "name": "rateTokenOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateRegistry",
      "accounts": [
        {
          "name": "registry",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": [
        {
          "name": "rateTokenIn",
          "type": "u64"
        },
        {
          "name": "rateTokenOut",
          "type": "u64"
        }
      ]
    },
    {
      "name": "swap",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "swapper",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenInAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenOutAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amountRequested",
          "type": "u64"
        }
      ]
    },
    {
      "name": "collectProceeds",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "vaultTokenIn",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "adminProceedsAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "collectReserve",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vaultTokenOut",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "adminReserveAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "registry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "vaultTokenIn",
            "type": "publicKey"
          },
          {
            "name": "vaultTokenOut",
            "type": "publicKey"
          },
          {
            "name": "rateTokenIn",
            "type": "u64"
          },
          {
            "name": "rateTokenOut",
            "type": "u64"
          },
          {
            "name": "mintTokenIn",
            "type": "publicKey"
          },
          {
            "name": "mintTokenOut",
            "type": "publicKey"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "InsufficientUserFunds",
      "msg": "Insufficient user funds"
    },
    {
      "code": 301,
      "name": "InsufficientVaultFunds",
      "msg": "Insufficient vault funds"
    },
    {
      "code": 302,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    }
  ]
};
