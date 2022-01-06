export type Draffle = {
  "version": "0.1.0",
  "name": "draffle",
  "instructions": [
    {
      "name": "createRaffle",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proceedsMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "endTimestamp",
          "type": "i64"
        },
        {
          "name": "ticketPrice",
          "type": "u64"
        },
        {
          "name": "maxEntrants",
          "type": "u32"
        }
      ]
    },
    {
      "name": "addPrize",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "from",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prize",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prizeMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "prizeIndex",
          "type": "u32"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyTickets",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTransferAuthority",
          "isMut": false,
          "isSigner": true
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
          "type": "u32"
        }
      ]
    },
    {
      "name": "revealWinners",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recentBlockhashes",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimPrize",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "prize",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerTokenAccount",
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
          "name": "prizeIndex",
          "type": "u32"
        },
        {
          "name": "ticketIndex",
          "type": "u32"
        }
      ]
    },
    {
      "name": "collectProceeds",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "creatorProceeds",
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
      "name": "closeEntrants",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "totalPrizes",
            "type": "u32"
          },
          {
            "name": "claimedPrizes",
            "type": "u32"
          },
          {
            "name": "randomness",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "ticketPrice",
            "type": "u64"
          },
          {
            "name": "entrants",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "entrants",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "total",
            "type": "u32"
          },
          {
            "name": "max",
            "type": "u32"
          },
          {
            "name": "entrants",
            "type": {
              "array": [
                "publicKey",
                5000
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MaxEntrantsTooLarge",
      "msg": "Max entrants is too large"
    },
    {
      "code": 6001,
      "name": "RaffleEnded",
      "msg": "Raffle has ended"
    },
    {
      "code": 6002,
      "name": "InvalidPrizeIndex",
      "msg": "Invalid prize index"
    },
    {
      "code": 6003,
      "name": "NoPrize",
      "msg": "No prize"
    },
    {
      "code": 6004,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    },
    {
      "code": 6005,
      "name": "NotEnoughTicketsLeft",
      "msg": "Not enough tickets left"
    },
    {
      "code": 6006,
      "name": "RaffleStillRunning",
      "msg": "Raffle is still running"
    },
    {
      "code": 6007,
      "name": "WinnersAlreadyDrawn",
      "msg": "Winner already drawn"
    },
    {
      "code": 6008,
      "name": "WinnerNotDrawn",
      "msg": "Winner not drawn"
    },
    {
      "code": 6009,
      "name": "InvalidRevealedData",
      "msg": "Invalid revealed data"
    },
    {
      "code": 6010,
      "name": "TokenAccountNotOwnedByWinner",
      "msg": "Ticket account not owned by winner"
    },
    {
      "code": 6011,
      "name": "TicketHasNotWon",
      "msg": "Ticket has not won"
    },
    {
      "code": 6012,
      "name": "UnclaimedPrizes",
      "msg": "Unclaimed prizes"
    },
    {
      "code": 6013,
      "name": "InvalidRecentBlockhashes",
      "msg": "Invalid recent blockhashes"
    }
  ]
};

export const IDL: Draffle = {
  "version": "0.1.0",
  "name": "draffle",
  "instructions": [
    {
      "name": "createRaffle",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proceedsMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "endTimestamp",
          "type": "i64"
        },
        {
          "name": "ticketPrice",
          "type": "u64"
        },
        {
          "name": "maxEntrants",
          "type": "u32"
        }
      ]
    },
    {
      "name": "addPrize",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "from",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prize",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prizeMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "prizeIndex",
          "type": "u32"
        },
        {
          "name": "amount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "buyTickets",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "buyerTransferAuthority",
          "isMut": false,
          "isSigner": true
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
          "type": "u32"
        }
      ]
    },
    {
      "name": "revealWinners",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "recentBlockhashes",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    },
    {
      "name": "claimPrize",
      "accounts": [
        {
          "name": "raffle",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "prize",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "winnerTokenAccount",
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
          "name": "prizeIndex",
          "type": "u32"
        },
        {
          "name": "ticketIndex",
          "type": "u32"
        }
      ]
    },
    {
      "name": "collectProceeds",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "proceeds",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        },
        {
          "name": "creatorProceeds",
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
      "name": "closeEntrants",
      "accounts": [
        {
          "name": "raffle",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "entrants",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "creator",
          "isMut": false,
          "isSigner": true
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "raffle",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "creator",
            "type": "publicKey"
          },
          {
            "name": "totalPrizes",
            "type": "u32"
          },
          {
            "name": "claimedPrizes",
            "type": "u32"
          },
          {
            "name": "randomness",
            "type": {
              "option": {
                "array": [
                  "u8",
                  32
                ]
              }
            }
          },
          {
            "name": "endTimestamp",
            "type": "i64"
          },
          {
            "name": "ticketPrice",
            "type": "u64"
          },
          {
            "name": "entrants",
            "type": "publicKey"
          }
        ]
      }
    },
    {
      "name": "entrants",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "total",
            "type": "u32"
          },
          {
            "name": "max",
            "type": "u32"
          },
          {
            "name": "entrants",
            "type": {
              "array": [
                "publicKey",
                5000
              ]
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "MaxEntrantsTooLarge",
      "msg": "Max entrants is too large"
    },
    {
      "code": 6001,
      "name": "RaffleEnded",
      "msg": "Raffle has ended"
    },
    {
      "code": 6002,
      "name": "InvalidPrizeIndex",
      "msg": "Invalid prize index"
    },
    {
      "code": 6003,
      "name": "NoPrize",
      "msg": "No prize"
    },
    {
      "code": 6004,
      "name": "InvalidCalculation",
      "msg": "Invalid calculation"
    },
    {
      "code": 6005,
      "name": "NotEnoughTicketsLeft",
      "msg": "Not enough tickets left"
    },
    {
      "code": 6006,
      "name": "RaffleStillRunning",
      "msg": "Raffle is still running"
    },
    {
      "code": 6007,
      "name": "WinnersAlreadyDrawn",
      "msg": "Winner already drawn"
    },
    {
      "code": 6008,
      "name": "WinnerNotDrawn",
      "msg": "Winner not drawn"
    },
    {
      "code": 6009,
      "name": "InvalidRevealedData",
      "msg": "Invalid revealed data"
    },
    {
      "code": 6010,
      "name": "TokenAccountNotOwnedByWinner",
      "msg": "Ticket account not owned by winner"
    },
    {
      "code": 6011,
      "name": "TicketHasNotWon",
      "msg": "Ticket has not won"
    },
    {
      "code": 6012,
      "name": "UnclaimedPrizes",
      "msg": "Unclaimed prizes"
    },
    {
      "code": 6013,
      "name": "InvalidRecentBlockhashes",
      "msg": "Invalid recent blockhashes"
    }
  ]
};
