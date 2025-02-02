import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { isMobile } from 'react-device-detect';
import { useWeb3React } from '@web3-react/core';
import { FiArrowLeft } from 'react-icons/fi';
import { useParams } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownContent,
  DropdownHeader,
} from '../common/DropdownMenu';
import { IconButton, Button } from '../common/Button';
import { useDetectBlur } from 'hooks/Guilds/useDetectBlur';
import { shortenAddress } from '../../../utils';
import { useVotingPowerOf } from '../../../hooks/Guilds/ether-swr/guild/useVotingPowerOf';
import { useGuildConfig } from '../../../hooks/Guilds/ether-swr/guild/useGuildConfig';
import { useERC20Info } from '../../../hooks/Guilds/ether-swr/erc20/useERC20Info';
import useENSAvatar from '../../../hooks/Guilds/ether-swr/ens/useENSAvatar';
import { MAINNET_ID } from '../../../utils/constants';
import Avatar from '../Avatar';
import { formatUnits } from 'ethers/lib/utils';
import { useVoterLockTimestamp } from '../../../hooks/Guilds/ether-swr/guild/useVoterLockTimestamp';
import moment from 'moment';
import StakeTokensModal from '../StakeTokensModal';
import { useTransactions } from '../../../contexts/Guilds';
import { useERC20Guild } from '../../../hooks/Guilds/contracts/useContract';
import useVotingPowerPercent from '../../../hooks/Guilds/guild/useVotingPowerPercent';
import useBigNumberToNumber from '../../../hooks/Guilds/conversions/useBigNumberToNumber';
import { Loading } from '../common/Loading';

const UserActionButton = styled(IconButton)`
  border-radius: 50px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  & > div:first-child {
    display: flex;
  }
`;

const IconHolder = styled.span`
  display: flex;
  justify-content: center;

  @media only screen and (min-width: 768px) {
    margin-right: 0.3rem;
  }

  img {
    border-radius: 50%;
    margin-right: 0;
  }
`;

const VotingPower = styled.div`
  background-color: #000;
  color: #fff;
  border-radius: 32px;
  padding: 2px 8px;
  font-weight: 500;
  font-size: 14px;
`;

const MemberContainer = styled.div`
  padding: 20px;
`;

const ContentItem = styled.div`
  display: flex;
  width: 100%;
  justify-content: space-between;
  font-size: 14px;
  padding-bottom: 8px;
`;

const LockButton = styled(Button)`
  margin-top: 12px;
  width: 100%;
`;

export const MemberActions = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const { guild_id: guildAddress } = useParams<{ guild_id?: string }>();
  const { account: userAddress } = useWeb3React();
  const { ensName, imageUrl } = useENSAvatar(userAddress, MAINNET_ID);
  const { data: guildConfig } = useGuildConfig(guildAddress);
  const { data: tokenInfo } = useERC20Info(guildConfig?.token);
  const { data: userVotingPower } = useVotingPowerOf({
    contractAddress: guildAddress,
    userAddress,
  });
  const { data: unlockedTimestamp } = useVoterLockTimestamp(
    guildAddress,
    userAddress
  );

  useEffect(() => {
    if (showStakeModal) setShowMenu(false);
  }, [showStakeModal]);

  const votingPowerPercent = useVotingPowerPercent(
    userVotingPower,
    guildConfig?.totalLocked
  );

  const roundedBalance = useBigNumberToNumber(
    userVotingPower,
    tokenInfo?.decimals,
    3
  );

  const isUnlockable = unlockedTimestamp
    ? unlockedTimestamp.isBefore(moment.now())
    : false;

  const { createTransaction } = useTransactions();
  const guildContract = useERC20Guild(guildAddress);
  const withdrawTokens = async () => {
    setShowMenu(false);
    createTransaction(
      `Unlock and withdraw ${formatUnits(
        userVotingPower,
        tokenInfo?.decimals
      )} ${tokenInfo?.symbol} tokens`,
      async () => guildContract.withdrawTokens(userVotingPower)
    );
  };

  const memberMenuRef = useRef(null);
  useDetectBlur(memberMenuRef, () => setShowMenu(false));
  return (
    <>
      <DropdownMenu ref={memberMenuRef}>
        <UserActionButton iconLeft onClick={() => setShowMenu(!showMenu)}>
          <div>
            <IconHolder>
              <Avatar src={imageUrl} defaultSeed={userAddress} size={18} />
            </IconHolder>
            <span>{ensName || shortenAddress(userAddress)}</span>
          </div>
          <VotingPower>
            {votingPowerPercent != null ? (
              `${votingPowerPercent}%`
            ) : (
              <Loading loading text skeletonProps={{ width: '40px' }} />
            )}
          </VotingPower>
        </UserActionButton>
        <DropdownContent fullScreenMobile={true} show={showMenu}>
          {isMobile && (
            <DropdownHeader noTopPadding onClick={() => setShowMenu(false)}>
              <FiArrowLeft /> <span>Membership</span>
            </DropdownHeader>
          )}
          <MemberContainer>
            <ContentItem>
              Voting Power{' '}
              <span>
                {votingPowerPercent != null ? (
                  `${votingPowerPercent}%`
                ) : (
                  <Loading loading text skeletonProps={{ width: '40px' }} />
                )}
              </span>
            </ContentItem>
            <ContentItem>
              {!isUnlockable ? 'Locked' : 'Staked'}{' '}
              <span>
                {userVotingPower && tokenInfo ? (
                  `${roundedBalance} ${tokenInfo.symbol}`
                ) : (
                  <Loading loading text skeletonProps={{ width: '40px' }} />
                )}
              </span>
            </ContentItem>

            <ContentItem>
              {isUnlockable ? 'Unlocked' : 'Unlocked in'}{' '}
              <span>
                {unlockedTimestamp ? (
                  isUnlockable ? (
                    unlockedTimestamp?.fromNow()
                  ) : (
                    unlockedTimestamp?.toNow(true)
                  )
                ) : (
                  <Loading loading text skeletonProps={{ width: '40px' }} />
                )}
              </span>
            </ContentItem>

            <LockButton onClick={() => setShowStakeModal(true)}>
              Increase Voting Power
            </LockButton>

            {isUnlockable && (
              <LockButton onClick={withdrawTokens}>Withdraw</LockButton>
            )}
          </MemberContainer>
        </DropdownContent>
      </DropdownMenu>

      <StakeTokensModal
        isOpen={showStakeModal}
        onDismiss={() => setShowStakeModal(false)}
      />
    </>
  );
};
