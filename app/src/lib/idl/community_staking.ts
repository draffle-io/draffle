export type CommunityStaking = {
  "version": "0.0.0",
  "name": "community_staking",
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
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
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
          "name": "rewardPeriod",
          "type": "i64"
        },
        {
          "name": "rewardRateNumerator",
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
          "name": "rewardPeriod",
          "type": "i64"
        },
        {
          "name": "rewardRateNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "assignController",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controllerRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateController",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controllerRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "maxMultiplier",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "control",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "controllerRecord",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "multiplier",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createStakeAccount",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
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
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "rewardPeriod",
            "type": "i64"
          },
          {
            "name": "rewardRateNumerator",
            "type": "u64"
          },
          {
            "name": "rewardRateDenominator",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controllerRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "maxMultiplier",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registry",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardsStartTimestamp",
            "type": "i64"
          },
          {
            "name": "rewardsEndTimestamp",
            "type": "i64"
          },
          {
            "name": "multiplier",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "AmountTooLarge",
      "msg": "Amount too large"
    },
    {
      "code": 301,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    },
    {
      "code": 302,
      "name": "InsufficientAmount",
      "msg": "Insufficient amount"
    },
    {
      "code": 303,
      "name": "MultiplierTooLarge",
      "msg": "Multiplier too large"
    },
    {
      "code": 304,
      "name": "ControllerDisabled",
      "msg": "Controller is disabled"
    }
  ]
};

export const IDL: CommunityStaking = {
  "version": "0.0.0",
  "name": "community_staking",
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
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "mint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
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
          "name": "rewardPeriod",
          "type": "i64"
        },
        {
          "name": "rewardRateNumerator",
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
          "name": "rewardPeriod",
          "type": "i64"
        },
        {
          "name": "rewardRateNumerator",
          "type": "u64"
        }
      ]
    },
    {
      "name": "assignController",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controllerRecord",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "updateController",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controllerRecord",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "enabled",
          "type": {
            "option": "bool"
          }
        },
        {
          "name": "maxMultiplier",
          "type": {
            "option": "u64"
          }
        }
      ]
    },
    {
      "name": "control",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "controller",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "controllerRecord",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "multiplier",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createStakeAccount",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakeAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "stake",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "stakerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
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
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unstake",
      "accounts": [
        {
          "name": "registry",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "vault",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "staker",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "stakerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "stakeAccount",
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
            "name": "vault",
            "type": "publicKey"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "rewardPeriod",
            "type": "i64"
          },
          {
            "name": "rewardRateNumerator",
            "type": "u64"
          },
          {
            "name": "rewardRateDenominator",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "controllerRecord",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "enabled",
            "type": "bool"
          },
          {
            "name": "maxMultiplier",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "stakeAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "registry",
            "type": "publicKey"
          },
          {
            "name": "amount",
            "type": "u64"
          },
          {
            "name": "rewardsStartTimestamp",
            "type": "i64"
          },
          {
            "name": "rewardsEndTimestamp",
            "type": "i64"
          },
          {
            "name": "multiplier",
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 300,
      "name": "AmountTooLarge",
      "msg": "Amount too large"
    },
    {
      "code": 301,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    },
    {
      "code": 302,
      "name": "InsufficientAmount",
      "msg": "Insufficient amount"
    },
    {
      "code": 303,
      "name": "MultiplierTooLarge",
      "msg": "Multiplier too large"
    },
    {
      "code": 304,
      "name": "ControllerDisabled",
      "msg": "Controller is disabled"
    }
  ]
};
