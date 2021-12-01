import { Theme } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

export const useStyles = makeStyles((theme: Theme) => ({
  root: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'justify',
  },
  titleSection: {
    width: '100%',
  },
  mainSection: {
    width: '100%',
    margin: '30px 0 30px 0',
    display: 'flex',
    flexDirection: 'row',
  },
  descriptionSection: {
    width: '55%',
    maxWidth: '600px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'baseline',
    textAlign: 'justify',
  },
  cleanupSection: {
    width: '45%',
    maxWidth: '600px',
    height: '100%',
    padding: '0 20px 0 50px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
  media: {
    maxWidth: '200px',
    width: '100%',
  },
  accordionItem: {
    width: '100%',
  },
  accordionContent: {
    width: '100%',
    padding: '0 10px 0 10px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'baseline',
    textAlign: 'justify',
  },
  highlightPrimary: {
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  highlightSecondary: {
    fontWeight: 'bold',
    color: theme.palette.secondary.main,
  },
  actionSectionInner: {
    padding: '10px 0',
    width: '90%',
    textAlign: 'center',
  },
  actionTagline: {
    width: '100%',
    marginBottom: '20px',
  },
  connectToBuyButton: {
    width: '60%',
    height: '40px',
  },
  accountCount: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountSelection: {
    width: '100%',
    padding: '0 10px 10px 10px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: '90%',
    height: '30px',
  },
  orDivider: {
    margin: '20px 0 20px 0',
  },
  purchaseButtonContent: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  purchaseButtonContentLeft: {
    width: '20%',
    display: 'flex',
    justifyContent: 'center',
  },
  purchaseButtonContentMiddle: {
    width: '60%',
  },
  purchaseButtonContentRight: {
    width: '20%',
  },
  purchaseSpinner: {
    height: '50px',
    color: theme.palette.secondary.main,
  },
  refreshButtonContainer: {
    margin: '2px 0 0 10px',
  },
  refreshButton: {
    width: '16px',
    height: '16px',
    color: theme.palette.secondary.main,
  },
}));
