import React, { FC } from 'react'
import { Switch, Route } from 'react-router-dom'

import { routes } from './routes'
import ExploreRafflesScreen from '../pages/ExploreRafflesScreen'
import RaffleDetailsScreen from './raffleDetails'
import LandingScreen from '../pages/LandingScreen'
import StakeScreen from '../pages/StakeScreen'
import AdminHomeScreen from '../pages/admin/AdminHomeScreen'
import AdminRaffleScreen from '../pages/admin/AdminRaffleScreen'
import ToolsScreen from '../pages/ToolsScreen'

export const Router: FC = () => (
    <Switch>
        <Route path="/" exact component={LandingScreen} />
        <Route path={`${routes.RAFFLES}/:id`} component={RaffleDetailsScreen} />
        {/* <Route path={'/'} exact component={RaffleDetailsScreen} /> */}

        <Route path={routes.RAFFLES} exact component={ExploreRafflesScreen} />
        <Route path={routes.STAKE} exact component={StakeScreen} />
        <Route path={routes.TOOLS} exact component={ToolsScreen} />
        <Route path={routes.ADMIN.HOME} exact component={AdminHomeScreen} />
        <Route
            path={`${routes.ADMIN.RAFFLES}/:id`}
            exact
            component={AdminRaffleScreen}
        />
    </Switch>
)
