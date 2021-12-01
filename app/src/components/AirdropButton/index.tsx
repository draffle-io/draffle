import { IconButton, Tooltip } from "@material-ui/core";
import { LocalAirport } from "@material-ui/icons";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FC, useState } from "react";
import toast from "react-hot-toast";
import { airdrop } from "../../lib/utils/airdrop";


const AirdropButton: FC = () => {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [loading, setLoading] = useState(false);
  
  return <Tooltip title="Aidrop for testing">
      <IconButton
        onClick={async () => {
          if (!publicKey) return;
          setLoading(true);
          await airdrop(connection, publicKey);
          setLoading(false);
          toast.success('Aidropped some SOL and some DT');
        }}
        disabled={loading}
      >
        <LocalAirport />
      </IconButton>
    </Tooltip>;
};

export default AirdropButton;